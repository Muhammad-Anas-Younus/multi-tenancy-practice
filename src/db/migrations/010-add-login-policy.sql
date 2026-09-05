CREATE POLICY user_login_policy ON users FOR
SELECT
    TO public USING (email = current_setting ('app.login_email', true))