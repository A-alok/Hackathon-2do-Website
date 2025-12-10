-- Fix RLS infinite recursion by using SECURITY DEFINER functions

-- Function to get team IDs the current user belongs to
-- SECURITY DEFINER allows this to run without triggering RLS on team_members
CREATE OR REPLACE FUNCTION get_my_team_ids()
RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT team_id FROM team_members WHERE user_id = auth.uid();
END;
$$;

-- Function to check if current user is admin of a team
CREATE OR REPLACE FUNCTION is_team_admin(lookup_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = lookup_team_id 
    AND user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;

-- Drop existing recursive policies
DROP POLICY IF EXISTS "teams_select_member" ON teams;
DROP POLICY IF EXISTS "teams_update_admin" ON teams;
DROP POLICY IF EXISTS "teams_delete_admin" ON teams;

DROP POLICY IF EXISTS "team_members_select" ON team_members;
DROP POLICY IF EXISTS "team_members_update" ON team_members;
DROP POLICY IF EXISTS "team_members_delete_admin" ON team_members;

-- Re-create policies using the helper functions

-- TEAMS policies
CREATE POLICY "teams_select_member" ON teams FOR SELECT 
  USING (id IN (SELECT get_my_team_ids()));

CREATE POLICY "teams_update_admin" ON teams FOR UPDATE 
  USING (is_team_admin(id));

CREATE POLICY "teams_delete_admin" ON teams FOR DELETE 
  USING (is_team_admin(id));

-- TEAM MEMBERS policies
CREATE POLICY "team_members_select" ON team_members FOR SELECT 
  USING (team_id IN (SELECT get_my_team_ids()));

-- Allow admins to update members, and creators (via teams table)
-- Note: teams table check might still recurse if we aren't careful, 
-- but is_team_admin is safe.
-- For the creator check: auth.uid() IN (SELECT created_by FROM teams WHERE id = team_members.team_id)
-- Accessing teams table will trigger teams SELECT policy: id IN (get_my_team_ids())
-- get_my_team_ids() accesses team_members (SECURITY DEFINER) -> Safe.
CREATE POLICY "team_members_update" ON team_members FOR UPDATE
USING (
  is_team_admin(team_id)
  OR
  auth.uid() IN (SELECT created_by FROM teams WHERE id = team_members.team_id)
);

CREATE POLICY "team_members_delete_admin" ON team_members FOR DELETE 
  USING (is_team_admin(team_id));
