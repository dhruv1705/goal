# Goals App Admin Panel

A simple web-based admin panel for managing and monitoring your Goals mobile app.

## Features

### 📊 Dashboard Overview
- **User Statistics**: Total users, goals, completion rates
- **Real-time Metrics**: Active schedules, goal categories breakdown
- **Analytics Charts**: Visual representation of goal categories

### 📋 Data Management
- **Goals Overview**: View recent goals with status, categories, and dates
- **Recent Activity**: Track user activity and goal creation
- **User Stats**: Average goals per user, completion rates, popular categories

### 🔒 Security
- Simple authentication system
- Session-based login
- Logout functionality

## Getting Started

### 1. Login to Admin Panel

1. Open `admin-login.html` in your web browser
2. Use the demo credentials:
   - **Username**: `admin`
   - **Password**: `admin123`
3. Click "Sign In"

### 2. Access Dashboard

After successful login, you'll be redirected to the main admin panel (`admin-panel.html`) which displays:

- **Statistics Cards**: Key metrics at a glance
- **Goals Table**: Recent goals with filtering
- **Activity Feed**: Latest user activities
- **Category Chart**: Visual breakdown of goal categories
- **User Analytics**: Detailed user statistics

## File Structure

```
goals/
├── admin-login.html          # Admin authentication page
├── admin-panel.html          # Main dashboard
└── ADMIN_PANEL_README.md     # This documentation
```

## Technical Details

### Database Connection
- **Backend**: Supabase
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Tables**: `goals`, `schedules`, `feedback`

### Authentication
- Simple session-based authentication
- Credentials stored in JavaScript (demo purposes)
- Session tokens stored in `sessionStorage`

### Data Sources
The admin panel pulls data from:
- `goals` table: User goals with status and categories
- `schedules` table: Daily tasks and completion status
- User analytics calculated in real-time

## Customization

### Adding New Admin Users
Currently uses hardcoded credentials in `admin-login.html`. To add new admins:

1. Open `admin-login.html`
2. Modify the `ADMIN_CREDENTIALS` object:
```javascript
const ADMIN_CREDENTIALS = {
    username: 'your_username',
    password: 'your_password'
}
```

### Modifying Dashboard Metrics
To add new statistics or modify existing ones:

1. Open `admin-panel.html`
2. Locate the `loadStats()` function
3. Add your custom queries and update the UI

### Styling
The admin panel uses a modern, responsive design with:
- Purple theme (`#7C3AED`) matching your mobile app
- Card-based layout
- Mobile-responsive design
- Chart.js for data visualization

## Security Considerations

⚠️ **Important**: This is a basic admin panel suitable for development and small-scale deployments.

For production use, consider:
- Server-side authentication
- Encrypted password storage
- HTTPS encryption
- Role-based access control
- Rate limiting
- Audit logging

## Browser Support

Works in all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Dependencies

- **Supabase JavaScript Client**: For database connectivity
- **Chart.js**: For data visualization
- **Modern Browser**: ES6+ support required

## Troubleshooting

### Cannot Connect to Database
- Verify Supabase URL and API key in `admin-panel.html`
- Check if RLS policies allow read access
- Ensure internet connection

### Authentication Issues
- Clear browser cache and session storage
- Verify credentials in `admin-login.html`
- Check browser console for errors

### Data Not Loading
- Check browser console for API errors
- Verify database table names match your schema
- Ensure proper permissions in Supabase

## Future Enhancements

Potential improvements for the admin panel:
- User management (create, edit, delete users)
- Goal template management
- Email notifications
- Export functionality (CSV, PDF)
- Advanced analytics and reporting
- Real-time updates with WebSockets
- Multi-admin role management

## Support

For issues or questions:
1. Check browser console for errors
2. Verify database connectivity
3. Review Supabase dashboard for API limits
4. Check RLS policies in your database

---

**Admin Panel Version**: 1.0  
**Compatible with**: Goals App v1.0  
**Last Updated**: December 2024