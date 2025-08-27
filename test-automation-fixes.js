/**
 * Test script to verify automation posting fixes
 * Tests the complete automation pipeline including AI generation, approval, posting, and email
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAutomation() {
  console.log('🧪 Testing Automation Pipeline Fixes\n');
  
  try {
    // Step 1: Get a test user and business
    console.log('1️⃣ Getting test user and business...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Not authenticated. Please log in first.');
      return;
    }
    
    const userId = user.id;
    console.log(`✅ Authenticated as user: ${userId}`);
    
    // Get user's first business with automation enabled
    const { data: businesses, error: bizError } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        business_settings!inner(
          auto_reply_enabled,
          auto_post_enabled,
          email_notifications_enabled
        )
      `)
      .eq('user_id', userId)
      .limit(1)
      .single();
    
    if (bizError || !businesses) {
      console.error('❌ No business found for user');
      return;
    }
    
    const businessId = businesses.id;
    console.log(`✅ Found business: ${businesses.name} (${businessId})`);
    console.log(`   Auto Reply: ${businesses.business_settings.auto_reply_enabled}`);
    console.log(`   Auto Post: ${businesses.business_settings.auto_post_enabled}`);
    console.log(`   Email: ${businesses.business_settings.email_notifications_enabled}\n`);
    
    // Step 2: Check for pending reviews
    console.log('2️⃣ Checking for pending reviews...');
    const { data: pendingReviews, error: reviewError } = await supabase
      .from('reviews')
      .select('id, customer_name, rating, status, ai_reply')
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .limit(5);
    
    if (reviewError) {
      console.error('❌ Error fetching reviews:', reviewError);
      return;
    }
    
    console.log(`✅ Found ${pendingReviews?.length || 0} pending reviews\n`);
    
    // Step 3: Test automation API with fixed parameters
    console.log('3️⃣ Testing automation API with fixes...');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const response = await fetch(`${appUrl}/api/automation/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': document.cookie // Include auth cookies if in browser
      },
      body: JSON.stringify({
        businessId: businessId,
        userId: userId,
        slotId: 'manual',
        triggerType: 'manual'
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Automation API error:', error);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Automation API Response:');
    console.log(`   Processed: ${result.processedReviews} reviews`);
    console.log(`   Generated: ${result.generatedReplies} AI replies`);
    console.log(`   Approved: ${result.autoApproved} reviews`);
    console.log(`   Posted: ${result.autoPosted} replies`);
    console.log(`   Emails: ${result.emailsSent} sent`);
    console.log(`   Errors: ${result.errors?.length || 0}\n`);
    
    // Step 4: Verify posting worked
    if (result.autoPosted > 0) {
      console.log('4️⃣ Verifying posted reviews...');
      const { data: postedReviews } = await supabase
        .from('reviews')
        .select('id, customer_name, rating, status, posted_at')
        .eq('business_id', businessId)
        .eq('status', 'posted')
        .order('posted_at', { ascending: false })
        .limit(result.autoPosted);
      
      console.log(`✅ Confirmed ${postedReviews?.length || 0} reviews posted:`);
      postedReviews?.forEach(r => {
        console.log(`   - ${r.customer_name} (${r.rating}⭐) - Posted: ${r.posted_at}`);
      });
    }
    
    // Step 5: Check for errors
    if (result.errors && result.errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      result.errors.forEach(err => {
        console.log(`   - ${err.step}: ${err.error}`);
      });
    }
    
    // Summary
    console.log('\n📊 Summary:');
    if (result.autoPosted === result.autoApproved && result.autoApproved > 0) {
      console.log('✅ All approved replies were successfully posted!');
    } else if (result.autoPosted > 0) {
      console.log(`⚠️ Partial success: ${result.autoPosted}/${result.autoApproved} approved replies posted`);
    } else if (result.autoApproved > 0) {
      console.log('❌ Posting failed: No replies were posted despite approvals');
    } else {
      console.log('ℹ️ No reviews were ready for posting');
    }
    
    if (result.emailsSent > 0) {
      console.log('✅ Email notifications sent successfully');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAutomation();
