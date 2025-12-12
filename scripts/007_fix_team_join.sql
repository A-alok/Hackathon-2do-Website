-- Allow authenticated users to view all teams (needed to look up by invite code)
-- The previous policy 'teams_select_member' only allowed viewing teams you were ALREADY in.

CREATE POLICY "teams_select_all" ON teams 
FOR SELECT 
USING (auth.role() = 'authenticated');
