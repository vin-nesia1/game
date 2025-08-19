/**
 * Google Apps Script untuk Game Points Backend
 * 
 * Setup:
 * 1. Buka Google Apps Script (script.google.com)
 * 2. Buat project baru
 * 3. Paste kode ini ke Code.gs
 * 4. Buat Google Sheet dengan nama "GamePointsDB" 
 * 5. Deploy sebagai Web App dengan akses untuk Anyone
 * 6. Copy URL deployment ke CONFIG.APPS_SCRIPT_URL di frontend
 */

// Konfigurasi
const SHEET_NAME = 'GamePointsDB';
const USERS_SHEET = 'Users';
const WITHDRAWS_SHEET = 'Withdraws';

/**
 * Main function untuk menangani POST requests
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    // Setup sheets jika belum ada
    setupSheets();
    
    switch (action) {
      case 'login':
        return handleLogin(data);
      case 'updatePoints':
        return handleUpdatePoints(data);
      case 'withdraw':
        return handleWithdraw(data);
      case 'getWithdrawHistory':
        return handleGetWithdrawHistory(data);
      case 'getLeaderboard':
        return handleGetLeaderboard(data);
      default:
        return createResponse(false, 'Unknown action: ' + action);
    }
  } catch (error) {
    console.error('Error in doPost:', error);
    return createResponse(false, 'Server error: ' + error.toString());
  }
}

/**
 * Handle GET requests (untuk testing)
 */
function doGet(e) {
  return ContentService
    .createTextOutput('Game Points API is running!')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Setup sheets jika belum ada
 */
function setupSheets() {
  const spreadsheet = SpreadsheetApp.openById(getOrCreateSpreadsheet());
  
  // Setup Users sheet
  let usersSheet = spreadsheet.getSheetByName(USERS_SHEET);
  if (!usersSheet) {
    usersSheet = spreadsheet.insertSheet(USERS_SHEET);
    usersSheet.getRange(1, 1, 1, 5).setValues([
      ['Email', 'UserID', 'Points', 'Created', 'LastUpdate']
    ]);
    usersSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  }
  
  // Setup Withdraws sheet
  let withdrawsSheet = spreadsheet.getSheetByName(WITHDRAWS_SHEET);
  if (!withdrawsSheet) {
    withdrawsSheet = spreadsheet.insertSheet(WITHDRAWS_SHEET);
    withdrawsSheet.getRange(1, 1, 1, 8).setValues([
      ['Email', 'UserID', 'Amount', 'Method', 'Account', 'Status', 'RequestDate', 'ProcessDate']
    ]);
    withdrawsSheet.getRange(1, 1, 1, 8).setFontWeight('bold');
  }
}

/**
 * Get or create spreadsheet
 */
function getOrCreateSpreadsheet() {
  // Coba cari spreadsheet yang sudah ada
  const files = DriveApp.getFilesByName(SHEET_NAME);
  
  if (files.hasNext()) {
    return files.next().getId();
  } else {
    // Buat spreadsheet baru
    const spreadsheet = SpreadsheetApp.create(SHEET_NAME);
    return spreadsheet.getId();
  }
}

/**
 * Handle login request
 */
function handleLogin(data) {
  try {
    const email = data.email;
    if (!email) {
      return createResponse(false, 'Email is required');
    }
    
    const spreadsheet = SpreadsheetApp.openById(getOrCreateSpreadsheet());
    const usersSheet = spreadsheet.getSheetByName(USERS_SHEET);
    const dataRange = usersSheet.getDataRange();
    const values = dataRange.getValues();
    
    // Cek apakah user sudah ada
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === email) {
        return createResponse(true, 'Login successful', {
          email: values[i][0],
          userId: values[i][1],
          points: values[i][2],
          isNew: false
        });
      }
    }
    
    // Buat user baru
    const newUserId = generateUserId();
    const now = new Date();
    
    usersSheet.appendRow([
      email,
      newUserId,
      0, // points
      now,
      now
    ]);
    
    return createResponse(true, 'New user created', {
      email: email,
      userId: newUserId,
      points: 0,
      isNew: true
    });
    
  } catch (error) {
    console.error('Error in handleLogin:', error);
    return createResponse(false, 'Login failed: ' + error.toString());
  }
}

/**
 * Handle update points request
 */
function handleUpdatePoints(data) {
  try {
    const email = data.email;
    const points = data.points;
    
    if (!email || points === undefined) {
      return createResponse(false, 'Email and points are required');
    }
    
    const spreadsheet = SpreadsheetApp.openById(getOrCreateSpreadsheet());
    const usersSheet = spreadsheet.getSheetByName(USERS_SHEET);
    const dataRange = usersSheet.getDataRange();
    const values = dataRange.getValues();
    
    // Update user points
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === email) {
        usersSheet.getRange(i + 1, 3).setValue(points); // Update points column
        usersSheet.getRange(i + 1, 5).setValue(new Date()); // Update last update
        
        return createResponse(true, 'Points updated', { points: points });
      }
    }
    
    return createResponse(false, 'User not found');
    
  } catch (error) {
    console.error('Error in handleUpdatePoints:', error);
    return createResponse(false, 'Update points failed: ' + error.toString());
  }
}

/**
 * Handle withdraw request
 */
function handleWithdraw(data) {
  try {
    const { email, userId, amount, method, account } = data;
    
    if (!email || !userId || !amount || !method || !account) {
      return createResponse(false, 'All fields are required');
    }
    
    if (amount < 1000) {
      return createResponse(false, 'Minimum withdraw is 1000 points');
    }
    
    const spreadsheet = SpreadsheetApp.openById(getOrCreateSpreadsheet());
    const usersSheet = spreadsheet.getSheetByName(USERS_SHEET);
    const withdrawsSheet = spreadsheet.getSheetByName(WITHDRAWS_SHEET);
    
    // Cek saldo user
    const userDataRange = usersSheet.getDataRange();
    const userValues = userDataRange.getValues();
    let userFound = false;
    let currentPoints = 0;
    
    for (let i = 1; i < userValues.length; i++) {
      if (userValues[i][0] === email) {
        userFound = true;
        currentPoints = userValues[i][2];
        
        if (currentPoints < amount) {
          return createResponse(false, 'Insufficient balance');
        }
        
        // Update user points (deduct withdraw amount)
        const newPoints = currentPoints - amount;
        usersSheet.getRange(i + 1, 3).setValue(newPoints);
        usersSheet.getRange(i + 1, 5).setValue(new Date());
        break;
      }
    }
    
    if (!userFound) {
      return createResponse(false, 'User not found');
    }
    
    // Add withdraw request
    withdrawsSheet.appendRow([
      email,
      userId,
      amount,
      method,
      account,
      'pending',
      new Date(),
      '' // Process date (empty until processed)
    ]);
    
    return createResponse(true, 'Withdraw request submitted successfully');
    
  } catch (error) {
    console.error('Error in handleWithdraw:', error);
    return createResponse(false, 'Withdraw failed: ' + error.toString());
  }
}

/**
 * Handle get withdraw history request
 */
function handleGetWithdrawHistory(data) {
  try {
    const email = data.email;
    
    if (!email) {
      return createResponse(false, 'Email is required');
    }
    
    const spreadsheet = SpreadsheetApp.openById(getOrCreateSpreadsheet());
    const withdrawsSheet = spreadsheet.getSheetByName(WITHDRAWS_SHEET);
    const dataRange = withdrawsSheet.getDataRange();
    const values = dataRange.getValues();
    
    const history = [];
    
    // Get user's withdraw history
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === email) {
        history.push({
          id: i,
          email: values[i][0],
          userId: values[i][1],
          amount: values[i][2],
          method: values[i][3],
          account: values[i][4],
          status: values[i][5],
          date: values[i][6],
          processDate: values[i][7]
        });
      }
    }
    
    // Sort by date (newest first)
    history.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return createResponse(true, 'Withdraw history retrieved', { history: history });
    
  } catch (error) {
    console.error('Error in handleGetWithdrawHistory:', error);
    return createResponse(false, 'Get withdraw history failed: ' + error.toString());
  }
}

/**
 * Handle get leaderboard request
 */
function handleGetLeaderboard(data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(getOrCreateSpreadsheet());
    const usersSheet = spreadsheet.getSheetByName(USERS_SHEET);
    const dataRange = usersSheet.getDataRange();
    const values = dataRange.getValues();
    
    const leaderboard = [];
    
    // Get all users with their points
    for (let i = 1; i < values.length; i++) {
      leaderboard.push({
        email: values[i][0],
        userId: values[i][1],
        points: values[i][2]
      });
    }
    
    // Sort by points (highest first) and get top 5
    leaderboard.sort((a, b) => b.points - a.points);
    const top5 = leaderboard.slice(0, 5);
    
    return createResponse(true, 'Leaderboard retrieved', { leaderboard: top5 });
    
  } catch (error) {
    console.error('Error in handleGetLeaderboard:', error);
    return createResponse(false, 'Get leaderboard failed: ' + error.toString());
  }
}

/**
 * Generate unique user ID
 */
function generateUserId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `user_${timestamp}_${random}`;
}

/**
 * Create standardized response
 */
function createResponse(success, message, data = {}) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Admin function: Get all users (for admin panel)
 */
function getAllUsers() {
  try {
    const spreadsheet = SpreadsheetApp.openById(getOrCreateSpreadsheet());
    const usersSheet = spreadsheet.getSheetByName(USERS_SHEET);
    const dataRange = usersSheet.getDataRange();
    const values = dataRange.getValues();
    
    const users = [];
    
    for (let i = 1; i < values.length; i++) {
      users.push({
        email: values[i][0],
        userId: values[i][1],
        points: values[i][2],
        created: values[i][3],
        lastUpdate: values[i][4]
      });
    }
    
    return users;
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return [];
  }
}

/**
 * Admin function: Get all withdraw requests (for admin panel)
 */
function getAllWithdraws() {
  try {
    const spreadsheet = SpreadsheetApp.openById(getOrCreateSpreadsheet());
    const withdrawsSheet = spreadsheet.getSheetByName(WITHDRAWS_SHEET);
    const dataRange = withdrawsSheet.getDataRange();
    const values = dataRange.getValues();
    
    const withdraws = [];
    
    for (let i = 1; i < values.length; i++) {
      withdraws.push({
        rowIndex: i + 1,
        email: values[i][0],
        userId: values[i][1],
        amount: values[i][2],
        method: values[i][3],
        account: values[i][4],
        status: values[i][5],
        requestDate: values[i][6],
        processDate: values[i][7]
      });
    }
    
    return withdraws;
  } catch (error) {
    console.error('Error in getAllWithdraws:', error);
    return [];
  }
}

/**
 * Admin function: Update withdraw status
 */
function updateWithdrawStatus(email, requestDate, status) {
  try {
    const spreadsheet = SpreadsheetApp.openById(getOrCreateSpreadsheet());
    const withdrawsSheet = spreadsheet.getSheetByName(WITHDRAWS_SHEET);
    const dataRange = withdrawsSheet.getDataRange();
    const values = dataRange.getValues();
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === email && values[i][6].toString() === requestDate.toString()) {
        withdrawsSheet.getRange(i + 1, 6).setValue(status); // Status column
        withdrawsSheet.getRange(i + 1, 8).setValue(new Date()); // Process date column
        
        // If rejected, add points back to user
        if (status === 'rejected') {
          const amount = values[i][2];
          addPointsToUser(email, amount);
        }
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error in updateWithdrawStatus:', error);
    return false;
  }
}

/**
 * Admin function: Add points to user (for rejected withdraws)
 */
function addPointsToUser(email, pointsToAdd) {
  try {
    const spreadsheet = SpreadsheetApp.openById(getOrCreateSpreadsheet());
    const usersSheet = spreadsheet.getSheetByName(USERS_SHEET);
    const dataRange = usersSheet.getDataRange();
    const values = dataRange.getValues();
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === email) {
        const currentPoints = values[i][2];
        const newPoints = currentPoints + pointsToAdd;
        usersSheet.getRange(i + 1, 3).setValue(newPoints);
        usersSheet.getRange(i + 1, 5).setValue(new Date());
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error in addPointsToUser:', error);
    return false;
  }
}

/**
 * Admin function: Reset user points
 */
function resetUserPoints(email) {
  try {
    const spreadsheet = SpreadsheetApp.openById(getOrCreateSpreadsheet());
    const usersSheet = spreadsheet.getSheetByName(USERS_SHEET);
    const dataRange = usersSheet.getDataRange();
    const values = dataRange.getValues();
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === email) {
        usersSheet.getRange(i + 1, 3).setValue(0);
        usersSheet.getRange(i + 1, 5).setValue(new Date());
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error in resetUserPoints:', error);
    return false;
  }
}

/**
 * Testing function
 */
function testAPI() {
  // Test login
  const loginResult = handleLogin({ email: 'test@example.com' });
  console.log('Login test:', loginResult.getContent());
  
  // Test update points
  const updateResult = handleUpdatePoints({ email: 'test@example.com', points: 100 });
  console.log('Update points test:', updateResult.getContent());
  
  // Test leaderboard
  const leaderboardResult = handleGetLeaderboard({});
  console.log('Leaderboard test:', leaderboardResult.getContent());
}

/**
 * Initialize function - run once to setup everything
 */
function initialize() {
  setupSheets();
  console.log('Sheets setup completed');
  
  // Create some test data
  const testUsers = [
    { email: 'user1@example.com', points: 1500 },
    { email: 'user2@example.com', points: 2000 },
    { email: 'user3@example.com', points: 500 },
  ];
  
  testUsers.forEach(user => {
    handleLogin({ email: user.email });
    handleUpdatePoints({ email: user.email, points: user.points });
  });
  
  console.log('Test data created');
}
