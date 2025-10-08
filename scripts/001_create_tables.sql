-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  blob_url TEXT NOT NULL,
  duration FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create timestamp_notes table
CREATE TABLE IF NOT EXISTS timestamp_notes (
  id SERIAL PRIMARY KEY,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  timestamp FLOAT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_video FOREIGN KEY (video_id) REFERENCES videos(id)
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  timestamp FLOAT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_video_quiz FOREIGN KEY (video_id) REFERENCES videos(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_timestamp_notes_video_id ON timestamp_notes(video_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_video_id ON quizzes(video_id);
CREATE INDEX IF NOT EXISTS idx_timestamp_notes_timestamp ON timestamp_notes(timestamp);
CREATE INDEX IF NOT EXISTS idx_quizzes_timestamp ON quizzes(timestamp);
