#!/usr/bin/env node

/**
 * Test automation API with the fixes for posting replies
 * Run: node test-automation-api.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAutomation() {
  console.log('🧪 Testing Automation Pipeline with Posting Fixes\n');
  console.log('='.repeat(50));
  
  try {
    // Get a business with automation enabled
    console.log('\n📋 Finding test business with automation enabled...');
    const { data: businesses, error: bizError } = await supabase
      .from('businesses')
      .select(`
        id,
        user_id,
        name,
        business_settings!inner(
          auto_reply_enabled,
          auto_post_enabled,
          email_notifications_enabled,
          approval_mode
        )
      `)
      .eq('business_settings.auto_reply_enabled', true)
      .limit(1)
      .single();
    
    if (bizError || !businesses) {
      console.error('❌ No business found with automation enabled');
      console.log('Please ensure at least one business has auto_reply_enabled = true');
      return;
    }
    
    const businessId = businesses.id;
    const userId = businesses.user_id;
    const settings = businesses.business_settings;
    
    console.log(`✅ Found business: ${businesses.name}`);
    console.log(`   Business ID: ${businessId}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Auto Reply: ${settings.auto_reply_enabled}`);
    console.log(`   Auto Post: ${settings.auto_post_enabled}`);
    console.log(`   Email: ${settings.email_notifications_enabled}`);
    console.log(`   Approval Mode: ${settings.approval_mode}`);
    
    // Check for pending reviews
    console.log('\n📝 Checking for pending reviews...');
    const { data: pendingReviews, error: reviewError } = await supabase
      .from('reviews')
      .select('id, customer_name, rating, status, ai_reply, automated_reply')
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .eq('automated_reply', false)
      .limit(10);
    
    if (reviewError) {
      console.error('❌ Error fetching reviews:', reviewError);
      return;
    }
    
    console.log(`✅ Found ${pendingReviews?.length || 0} pending reviews to process`);
    if (pendingReviews?.length > 0) {
      pendingReviews.slice(0, 3).forEach(r => {
        console.log(`   - ${r.customer_name} (${r.rating}⭐)`);
      });
      if (pendingReviews.length > 3) {
        console.log(`   ... and ${pendingReviews.length - 3} more`);
      }
    }
    
    // Call automation API
    console.log('\n🚀 Calling automation API with fixed parameters...');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    console.log(`   API URL: ${appUrl}/api/automation/process`);
    
    const response = await fetch(`${appUrl}/api/automation/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessId: businessId,
        userId: userId,
        slotId: 'test',
        triggerType: 'manual'
      })
    });
    
    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ Automation API error:', response.status);
      console.error('Response:', responseText);
      return;
    }
    
    const result = JSON.parse(responseText);
    
    console.log('\n📊 Automation Results:');
    console.log('='.repeat(50));
    console.log(`✅ Success: ${result.success}`);
    console.log(`📝 Processed Reviews: ${result.processedReviews}`);
    console.log(`🤖 Generated AI Replies: ${result.generatedReplies}`);
    console.log(`✅ Auto-Approved: ${result.autoApproved}`);
    console.log(`📤 Auto-Posted to Google: ${result.autoPosted}`);
    console.log(`📧 Email Notifications: ${result.emailsSent}`);
    console.log(`⚠️ Errors: ${result.errors?.length || 0}`);
    console.log(`⏱️ Duration: ${result.duration}ms`);
    
    // Check posting success
    console.log('\n🔍 Analyzing Results:');
    if (result.autoPosted > 0 && result.autoPosted === result.autoApproved) {
      console.log('✅ SUCCESS: All approved replies were posted to Google!');
      console.log('   The posting fix is working correctly.');
    } else if (result.autoPosted > 0) {
      console.log(`⚠️ PARTIAL: ${result.autoPosted}/${result.autoApproved} approved replies were posted`);
    } else if (result.autoApproved > 0) {
      console.log('❌ FAILURE: No replies were posted despite having approvals');
      console.log('   Check the errors below for details.');
    } else {
      console.log('ℹ️ No reviews were processed or approved for posting');
    }
    
    if (result.emailsSent > 0) {
      console.log(`✅ Email notifications sent: ${result.emailsSent}`);
    }
    
    // Show errors if any
    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️ Errors Encountered:');
      result.errors.forEach((err, i) => {
        console.log(`   ${i + 1}. Step: ${err.step}`);
        console.log(`      Error: ${err.error}`);
        if (err.reviewId) {
          console.log(`      Review ID: ${err.reviewId}`);
        }
      });
    }
    
    // Verify in database
    if (result.autoPosted > 0) {
      console.log('\n🔍 Verifying in database...');
      const { data: postedReviews } = await supabase
        .from('reviews')
        .select('customer_name, rating, status, posted_at')
        .eq('business_id', businessId)
        .eq('status', 'posted')
        .order('posted_at', { ascending: false })
        .limit(result.autoPosted);
      
      if (postedReviews?.length > 0) {
        console.log(`✅ Confirmed ${postedReviews.length} reviews marked as posted:`);
        postedReviews.forEach(r => {
          const postedTime = new Date(r.posted_at).toLocaleString();
          console.log(`   - ${r.customer_name} (${r.rating}⭐) - ${postedTime}`);
        });
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('Test complete! Check the results above.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
console.log('🏁 Starting Automation Test...');
testAutomation();
