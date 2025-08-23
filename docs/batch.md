# Batch AI Reply Generation Implementation Plan

## Overview
This document outlines the implementation plan for adding batch AI reply generation to the Reviews page. The feature will allow users to generate AI replies for multiple selected reviews at once, following existing batch action patterns.

## Architecture

### 1. Frontend Components

#### BulkActionsBar Component Update
**File:** `components/BulkActionsBar.tsx`

Add a new "Generate Replies" button to the existing bulk actions:
- Position between "Approve" and "Post" buttons
- Icon: `Sparkles` from lucide-react
- Color scheme: Purple (bg-purple-600 hover:bg-purple-700)
- Subscription gating: Available only for subscribers
- Props to add: `onGenerateReplies` callback

```tsx
// New button in BulkActionsBar
<Button
  onClick={isSubscriber ? onGenerateReplies : onUpgradeRequired}
  disabled={isLoading}
  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white"
  size="sm"
  title={isSubscriber ? "Generate AI replies for selected reviews" : "AI generation requires subscription"}
>
  {isLoading ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <Sparkles className="h-4 w-4" />
  )}
  <span>{isSubscriber ? "Generate Replies" : "Generate (Upgrade)"}</span>
</Button>
```

#### Reviews Page Integration
**File:** `app/(app)/reviews/page.tsx`

Add handler for batch reply generation:
```tsx
const handleBulkGenerateReplies = async () => {
  const selectedIds = Array.from(selection.selectedIds);
  await bulkActions.generateReplies(selectedIds);
};
```

Pass to BulkActionsBar:
```tsx
<BulkActionsBar
  // ... existing props
  onGenerateReplies={handleBulkGenerateReplies}
/>
```

### 2. Data Hook Enhancement

#### useReviewsData Hook
**File:** `hooks/useReviewsData.ts`

Add new bulk action for generating replies:

```tsx
generateReplies: async (reviewIds: string[]) => {
  try {
    setIsLoading(true);
    
    // Filter to only pending reviews (no existing reply)
    const pendingReviews = reviews.filter(r => 
      reviewIds.includes(r.id) && 
      (!r.ai_reply || r.ai_reply.trim() === '')
    );
    
    if (pendingReviews.length === 0) {
      toast({
        title: "No reviews to generate",
        description: "Selected reviews already have replies",
        variant: "default"
      });
      return;
    }

    // Show progress toast
    const toastId = toast({
      title: "Generating AI Replies",
      description: `Processing ${pendingReviews.length} reviews...`,
      duration: Infinity // Keep showing until complete
    });

    // Call batch generation API
    const response = await fetch('/api/ai/batch-generate-replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewIds: pendingReviews.map(r => r.id),
        businessId: pendingReviews[0].business_id,
        userId: user?.id
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate replies');
    }

    const result = await response.json();
    
    // Update local state with generated replies
    setReviews(prev => prev.map(review => {
      const generated = result.results.find(r => r.reviewId === review.id);
      if (generated && generated.success) {
        return {
          ...review,
          ai_reply: generated.reply,
          reply_tone: generated.tone || 'friendly',
          final_reply: generated.reply,
          updated_at: new Date().toISOString()
        };
      }
      return review;
    }));

    // Dismiss progress toast and show results
    toast.dismiss(toastId);
    
    const successCount = result.results.filter(r => r.success).length;
    const failureCount = result.results.filter(r => !r.success).length;
    
    if (successCount > 0 && failureCount === 0) {
      toast({
        title: "Replies Generated",
        description: `Successfully generated ${successCount} replies`,
        variant: "success"
      });
    } else if (successCount > 0 && failureCount > 0) {
      toast({
        title: "Partial Success",
        description: `Generated ${successCount} replies, ${failureCount} failed`,
        variant: "warning"
      });
    } else {
      toast({
        title: "Generation Failed",
        description: "Failed to generate replies. Please try again.",
        variant: "destructive"
      });
    }
    
    // Clear selection after successful generation
    if (successCount > 0) {
      selection.clearSelection();
    }
    
  } catch (error) {
    console.error('Batch generate replies error:', error);
    toast({
      title: "Error",
      description: "Failed to generate replies. Please try again.",
      variant: "destructive"
    });
  } finally {
    setIsLoading(false);
  }
}
```

### 3. API Endpoint

#### New Batch Generate Replies Endpoint
**File:** `app/api/ai/batch-generate-replies/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkUserSubscription } from '@/lib/utils/subscription';
import { batchGenerateReplies } from '@/lib/services/aiReplyService';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { reviewIds, businessId, userId } = await request.json();

    // Validate input
    if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid review IDs' },
        { status: 400 }
      );
    }

    if (!businessId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check subscription
    const subscriptionStatus = await checkUserSubscription(userId);
    if (!subscriptionStatus.isSubscriber) {
      return NextResponse.json(
        {
          error: 'Subscription required',
          message: 'Batch AI reply generation requires an active subscription.',
          code: 'SUBSCRIPTION_REQUIRED'
        },
        { status: 403 }
      );
    }

    // Fetch reviews with customer info
    const { data: reviews, error: fetchError } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .in('id', reviewIds)
      .eq('business_id', businessId);

    if (fetchError || !reviews) {
      throw new Error('Failed to fetch reviews');
    }

    // Fetch business info and settings
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    const { data: settings } = await supabaseAdmin
      .from('business_settings')
      .select('*')
      .eq('business_id', businessId)
      .single();

    // Generate replies in batch
    const results = await batchGenerateReplies(
      reviews,
      {
        name: business?.name || 'Business',
        industry: business?.industry || 'General'
      },
      settings?.brand_voice || {},
      userId
    );

    // Update database with generated replies
    const updatePromises = results.results.map(async (result) => {
      if (result.success && result.reply) {
        return supabaseAdmin
          .from('reviews')
          .update({
            ai_reply: result.reply,
            reply_tone: result.tone || 'friendly',
            final_reply: result.reply,
            updated_at: new Date().toISOString()
          })
          .eq('id', result.reviewId);
      }
      return null;
    });

    await Promise.all(updatePromises.filter(Boolean));

    // Return results
    return NextResponse.json({
      success: true,
      results: results.results,
      summary: {
        total: results.summary.total,
        successful: results.summary.successful,
        failed: results.summary.failed
      }
    });

  } catch (error) {
    console.error('Batch generate replies error:', error);
    return NextResponse.json(
      { error: 'Failed to generate replies' },
      { status: 500 }
    );
  }
}
```

### 4. Service Layer Updates

The existing `aiReplyService.ts` already has the `batchGenerateReplies` function that handles:
- Batch processing with configurable batch size (default: 3)
- Concurrent processing with delays between batches
- Error handling and partial failure recovery
- Structured result format with per-review success/failure

No changes needed to the service layer as it's already well-structured for batch operations.

## Database Updates

### Reviews Table
No schema changes required. The batch operation will update existing fields:
- `ai_reply`: Store the generated AI reply
- `reply_tone`: Store the tone used (from brand voice preset)
- `final_reply`: Copy of ai_reply for consistency
- `updated_at`: Timestamp of generation

## UI/UX Considerations

### Loading States
1. **Global Loading**: Show spinner on the "Generate Replies" button during processing
2. **Progress Toast**: Display a persistent toast showing "Processing X reviews..."
3. **Button Disabled States**: Disable all bulk action buttons during processing
4. **Selection Lock**: Prevent selection changes during batch processing

### Error Handling
1. **Partial Failures**: Handle cases where some reviews succeed and others fail
2. **Clear Messaging**: Show specific counts of success/failure in toast notifications
3. **Retry Logic**: Failed reviews remain selected for potential retry
4. **Validation**: Pre-check for reviews that already have replies

### Success Feedback
1. **Toast Notification**: Show success count and clear selection
2. **Immediate UI Update**: Update table rows with generated replies
3. **Visual Indicators**: Consider adding a brief highlight animation to updated rows

## Performance Optimizations

### Batch Processing Strategy
- **Batch Size**: Process 3 reviews per batch (configurable)
- **Concurrency**: Process batches sequentially with 500ms delay
- **Timeout**: 30-second timeout per batch
- **Memory Management**: Stream results instead of loading all at once

### Caching
- No caching for batch generation (always fresh)
- Leverage existing review data in memory
- Reuse business settings across all reviews in batch

## Security Considerations

1. **Authentication**: Verify user owns the business
2. **Subscription Check**: Enforce subscription requirement
3. **Rate Limiting**: Consider adding rate limits for batch operations
4. **Input Validation**: Validate all review IDs belong to the same business
5. **Error Sanitization**: Don't expose internal errors to client

## Testing Strategy

### Unit Tests
- Test batch processing logic with various batch sizes
- Test error handling for partial failures
- Test subscription validation

### Integration Tests
- Test full flow from UI selection to database update
- Test concurrent batch operations
- Test error recovery scenarios

### Manual Testing Checklist
- [ ] Select multiple reviews and generate replies
- [ ] Test with mix of rated reviews (1-5 stars)
- [ ] Test partial failure handling
- [ ] Test subscription gating
- [ ] Test loading states and progress indicators
- [ ] Test with large selections (20+ reviews)
- [ ] Test cancellation mid-process
- [ ] Verify database updates are correct
- [ ] Test selection clearing after success
- [ ] Test error messages for various failure modes

## Implementation Steps

1. **Phase 1: API Endpoint** (Priority: High)
   - Create `/api/ai/batch-generate-replies` endpoint
   - Add subscription validation
   - Implement database update logic

2. **Phase 2: Hook Integration** (Priority: High)
   - Add `generateReplies` to `bulkActions` in `useReviewsData`
   - Handle state updates and optimistic UI
   - Add progress tracking

3. **Phase 3: UI Components** (Priority: High)
   - Update `BulkActionsBar` with new button
   - Add handler in Reviews page
   - Implement loading states

4. **Phase 4: Testing & Polish** (Priority: Medium)
   - Add error boundary for batch operations
   - Implement retry mechanism
   - Add analytics tracking
   - Performance testing with large batches

## Rollout Plan

1. **Development**: Implement in feature branch
2. **Testing**: Internal testing with various scenarios
3. **Staging**: Deploy to staging for broader testing
4. **Monitoring**: Add logging for batch operations
5. **Production**: Gradual rollout with feature flag if needed

## Success Metrics

- **Adoption Rate**: % of users using batch generation vs single
- **Success Rate**: % of successful batch generations
- **Performance**: Average time per review in batch
- **User Satisfaction**: Reduction in time to process reviews
- **Error Rate**: Track and minimize batch operation failures

## Future Enhancements

1. **Customization**: Allow tone/style selection for batch generation
2. **Templates**: Apply templates to batch operations
3. **Scheduling**: Queue batch operations for background processing
4. **Progress Bar**: Show detailed progress for large batches
5. **Selective Retry**: Allow retrying only failed reviews
6. **Bulk Edit**: Edit all generated replies before saving
7. **History**: Track batch operation history
8. **Undo**: Allow undoing batch generations
