-- Database schema for Prayer Modal system
-- PostgreSQL with UUID extension for better scalability

-- Create custom schema for kfmn prayer system
CREATE SCHEMA IF NOT EXISTS kfmn;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE kfmn.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    user_color VARCHAR(7) NOT NULL DEFAULT '#3b82f6', -- Hex color code
    user_avatar VARCHAR(10) NOT NULL DEFAULT '🙏', -- Emoji avatar
    notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Prayers table
CREATE TABLE kfmn.prayers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES kfmn.users(id) ON DELETE CASCADE,
    prayer_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Reactions table (emoji reactions to prayers)
CREATE TABLE kfmn.reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prayer_id UUID NOT NULL REFERENCES kfmn.prayers(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(prayer_id, emoji) -- One reaction type per prayer per emoji
);

-- Reaction users (many-to-many: which users reacted with which emoji)
CREATE TABLE kfmn.reaction_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reaction_id UUID NOT NULL REFERENCES kfmn.reactions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES kfmn.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(reaction_id, user_id) -- User can only react once per emoji type
);

-- Reaction comments (text comments attached to reactions)
CREATE TABLE kfmn.reaction_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reaction_id UUID NOT NULL REFERENCES kfmn.reactions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES kfmn.users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Scheduled prayer calls
CREATE TABLE kfmn.scheduled_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL DEFAULT 'Gemeinsames Gebet',
    description TEXT,
    meeting_url TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES kfmn.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- User sessions for authentication
CREATE TABLE kfmn.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES kfmn.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET
);

-- Indexes for performance
CREATE INDEX idx_prayers_user_id ON kfmn.prayers(user_id);
CREATE INDEX idx_prayers_created_at ON kfmn.prayers(created_at DESC);
CREATE INDEX idx_reactions_prayer_id ON kfmn.reactions(prayer_id);
CREATE INDEX idx_reaction_users_reaction_id ON kfmn.reaction_users(reaction_id);
CREATE INDEX idx_reaction_users_user_id ON kfmn.reaction_users(user_id);
CREATE INDEX idx_reaction_comments_reaction_id ON kfmn.reaction_comments(reaction_id);
CREATE INDEX idx_scheduled_calls_scheduled_at ON kfmn.scheduled_calls(scheduled_at);
CREATE INDEX idx_user_sessions_token ON kfmn.user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON kfmn.user_sessions(expires_at);
CREATE INDEX idx_users_username ON kfmn.users(username);
CREATE INDEX idx_users_email ON kfmn.users(email);
CREATE INDEX idx_users_phone ON kfmn.users(phone);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON kfmn.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prayers_updated_at BEFORE UPDATE ON kfmn.prayers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_calls_updated_at BEFORE UPDATE ON kfmn.scheduled_calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get prayer with reaction counts and user reactions
CREATE OR REPLACE FUNCTION kfmn.get_prayer_with_reactions(prayer_uuid UUID, user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
    prayer_id UUID,
    user_id UUID,
    username VARCHAR(50),
    display_name VARCHAR(100),
    user_color VARCHAR(7),
    user_avatar VARCHAR(10),
    is_verified BOOLEAN,
    prayer_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    emoji VARCHAR(10),
    reaction_count BIGINT,
    user_reacted BOOLEAN,
    comment_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id as prayer_id,
        p.user_id,
        u.username,
        u.display_name,
        u.user_color,
        u.user_avatar,
        u.is_verified,
        p.prayer_text,
        p.created_at,
        r.emoji,
        COUNT(ru.id) as reaction_count,
        CASE WHEN user_uuid IS NOT NULL THEN
            EXISTS(SELECT 1 FROM kfmn.reaction_users ru2 WHERE ru2.reaction_id = r.id AND ru2.user_id = user_uuid)
        ELSE FALSE END as user_reacted,
        COUNT(rc.id) as comment_count
    FROM kfmn.prayers p
    JOIN kfmn.users u ON p.user_id = u.id
    LEFT JOIN kfmn.reactions r ON p.id = r.prayer_id
    LEFT JOIN kfmn.reaction_users ru ON r.id = ru.reaction_id
    LEFT JOIN kfmn.reaction_comments rc ON r.id = rc.reaction_id
    WHERE p.id = prayer_uuid
    GROUP BY p.id, p.user_id, u.username, u.display_name, u.user_color, u.user_avatar, u.is_verified, p.prayer_text, p.created_at, r.emoji, r.id
    ORDER BY r.emoji;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION kfmn.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM kfmn.user_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;