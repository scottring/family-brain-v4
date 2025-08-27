-- Custom Types and Enums for Family Brain V4
CREATE TYPE context_type AS ENUM ('personal', 'family', 'work');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE goal_status AS ENUM ('planning', 'active', 'completed', 'cancelled', 'paused');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'completed', 'cancelled', 'paused');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'completed', 'cancelled');
CREATE TYPE assignment_status AS ENUM ('assigned', 'in_progress', 'completed', 'skipped');
CREATE TYPE itinerary_status AS ENUM ('scheduled', 'in_progress', 'completed', 'skipped', 'postponed');
CREATE TYPE sharing_level AS ENUM ('private', 'family_read', 'family_edit');
CREATE TYPE family_role AS ENUM ('admin', 'member', 'child');