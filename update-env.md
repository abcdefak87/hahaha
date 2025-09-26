# UPDATE .ENV FILE

Please manually update your `server/.env` file with these values:

```env
# Add or update these values in server/.env

JWT_SECRET="76fd3ae3c68da075cc8b1b7ee745fe98990a34492f34acbf59020568330eb6149345145973e6020e46d91acb095d7021822a3b6fe44cb6d89d55ccca9d5ed03d"

JWT_REFRESH_SECRET="56e68f2d6db932e088e7e9747abceb40864faf8fb3979a8dd84d25b361b4af3282fdd1f3694b26099dc526065b3d6a3afd849a211610b132c6bc0f3b6afc19a3"

CSRF_SECRET="8e33a2c16d8193aba600d9cf75fc8a9bfc5a5364a63e805b8f798105bd9a17738d5096e56c9d9a0c57f93c8da2a0a449a5bdbc0cdbfd05382aeb7ff60b50ea1c"
```

## Steps:
1. Open `server/.env` file
2. Add the above secrets
3. Save the file
4. Restart the server

## Important:
- Never commit .env file to git
- Keep these secrets secure
