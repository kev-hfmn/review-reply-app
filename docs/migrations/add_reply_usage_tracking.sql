-- Add RPC function for atomic reply count increment
CREATE OR REPLACE FUNCTION increment_reply_count(
  p_user_id UUID,
  p_business_id UUID,
  p_billing_period_start TIMESTAMP WITH TIME ZONE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE subscription_usage 
  SET 
    replies_posted = replies_posted + 1,
    updated_at = NOW()
  WHERE 
    user_id = p_user_id 
    AND business_id = p_business_id 
    AND billing_period_start = p_billing_period_start;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_reply_count(UUID, UUID, TIMESTAMP WITH TIME ZONE) TO authenticated;
