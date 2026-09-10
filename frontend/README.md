# Drone Bangladesh Frontend

Normal Next.js frontend for the Drone Bangladesh e-commerce project.

## Windows / VS Code run

1. Install Node.js 20 LTS or newer.
2. Open a terminal in `frontend`.
3. Copy `.env.example` to `.env.local`.
4. Run `npm install`.
5. Run `npm run dev`.
6. Open `http://localhost:3000`.

The backend should run on `http://localhost:5000` and expose `/api/v1`.

## Production

Run `npm run build` and then `npm run start`. Set `NEXT_PUBLIC_API_URL` to the deployed API URL before building.
