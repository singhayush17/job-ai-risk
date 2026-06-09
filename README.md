# Job AI Risk

Will AI Take My Job? is a lightweight web app that analyzes job descriptions and predicts AI displacement risk over the next 10 years.

## What it does

- Paste or fetch a job posting URL
- Analyze the job description with AI
- Return a calibrated risk score
- Highlight tasks at risk and tasks likely to stay resilient
- Provide actionable advice for the role

## Public demo

Visit the live app at: https://future-job-meter.lovable.app/

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open the app in your browser at `http://localhost:5173`

## Notes

- The app is built with React, TanStack, Tailwind CSS, and Vite.
- AI analysis runs on the server and evaluates job descriptions for likely AI automation impact.
- You can paste a full job description or a job posting URL to get an instant risk assessment.
