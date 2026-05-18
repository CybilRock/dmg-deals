-- Migration 008: Enable Realtime on leads table for in-app notifications
-- Run in Supabase SQL editor

ALTER PUBLICATION supabase_realtime ADD TABLE leads;
