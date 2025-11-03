# Getting Your Airtable Personal Access Token (PAT)

## Step-by-Step Guide

### 1. Create Personal Access Token
1. **Go to Airtable Developer Hub:** https://airtable.com/create/tokens
2. **Click "Create new token"**
3. **Name your token:** e.g., "Interview Dashboard"

### 2. Set Token Scopes
Add these required scopes:
- ✅ **`data.records:read`** - Read records from your tables
- ✅ **`data.records:write`** - Update candidate status
- ✅ **`schema.bases:read`** - Read base structure

### 3. Add Base Access
1. **In the "Access" section, click "Add a base"**
2. **Select your interview/candidate base**
3. **Grant access to the specific base**

### 4. Create and Copy Token
1. **Click "Create token"**
2. **Copy the token** (starts with `pat...`)
3. **⚠️ Important:** Save it immediately - you won't see it again!

### 5. Update Configuration
1. **Open `dashboard/config.js`**
2. **Replace `YOUR_AIRTABLE_PERSONAL_ACCESS_TOKEN`** with your actual token
3. **Update your Base ID** (just the `appXXXXXXXXXXXX` part)

## Example Configuration

```javascript
airtable: {
    baseId: 'appni7Lgyrk5sjLXY',
    tableName: 'Candidates',
    personalAccessToken: 'pat14.eXAMPLEtOKEN...', // Your actual token
    baseUrl: 'https://api.airtable.com/v0'
}
```

## Security Notes
- ✅ **DO:** Keep your token secure and private
- ✅ **DO:** Use environment variables in production
- ❌ **DON'T:** Share or commit tokens to version control
- ❌ **DON'T:** Use the same token across multiple applications

## Token Permissions
Your token will allow the dashboard to:
- Read candidate records from your table
- Update candidate status (pending → accepted/rejected)
- Access table structure for proper field mapping

## Troubleshooting
- **"Access denied":** Check token scopes and base access
- **"Base not found":** Verify Base ID is correct
- **"Table not found":** Check table name matches exactly

Need help? Check the browser console for detailed error messages!