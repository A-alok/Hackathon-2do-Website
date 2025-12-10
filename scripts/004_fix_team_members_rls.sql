-- Allow team creators and admins to update team members
-- This is required for the upsert operation when a conflict occurs (e.g. race condition or re-adding a member)

CREATE POLICY "team_members_update" ON team_members FOR UPDATE
USING (
  auth.uid() IN (
    SELECT created_by FROM teams WHERE id = team_members.team_id
  )
  OR
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
