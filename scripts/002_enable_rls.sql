-- Enable Row Level Security on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE USING (auth.uid() = id);

-- Teams policies (users can see teams they're members of)
CREATE POLICY "teams_select_member" ON teams FOR SELECT 
  USING (id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "teams_insert_auth" ON teams FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "teams_update_admin" ON teams FOR UPDATE 
  USING (id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "teams_delete_admin" ON teams FOR DELETE 
  USING (id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin'));

-- Team members policies
CREATE POLICY "team_members_select" ON team_members FOR SELECT 
  USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "team_members_insert" ON team_members FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "team_members_delete_admin" ON team_members FOR DELETE 
  USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid() AND role = 'admin'));

-- Hackathons policies (team members can CRUD)
CREATE POLICY "hackathons_select_team" ON hackathons FOR SELECT 
  USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "hackathons_insert_team" ON hackathons FOR INSERT 
  WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "hackathons_update_team" ON hackathons FOR UPDATE 
  USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "hackathons_delete_team" ON hackathons FOR DELETE 
  USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

-- Tasks policies (team members can CRUD)
CREATE POLICY "tasks_select_team" ON tasks FOR SELECT 
  USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "tasks_insert_team" ON tasks FOR INSERT 
  WITH CHECK (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "tasks_update_team" ON tasks FOR UPDATE 
  USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));
CREATE POLICY "tasks_delete_team" ON tasks FOR DELETE 
  USING (team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()));

-- Task comments policies
CREATE POLICY "task_comments_select" ON task_comments FOR SELECT 
  USING (task_id IN (SELECT id FROM tasks WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())));
CREATE POLICY "task_comments_insert" ON task_comments FOR INSERT 
  WITH CHECK (user_id = auth.uid() AND task_id IN (SELECT id FROM tasks WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())));
CREATE POLICY "task_comments_delete_own" ON task_comments FOR DELETE USING (user_id = auth.uid());

-- Notification logs policies (users can see their own notifications)
CREATE POLICY "notification_logs_select_own" ON notification_logs FOR SELECT USING (recipient_id = auth.uid());
