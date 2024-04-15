const express = require('express');
const cors = require('cors'); // Import the cors middleware
const app = express();
const port = 3001;
app.use(cors());
// API endpoint URL
const apiUrl = 'https://esp32test-trigger-default-rtdb.asia-southeast1.firebasedatabase.app/AllHis.json';

// Fetch data from the API endpoint
async function fetchDataFromApi() {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data from API:', error);
        return null;
    }
}
// Count occurrences of actions by day, hour, and year based on fetched data
async function countActionsByDayHourAndYear() {
  const data = await fetchDataFromApi();
  if (!data) {
      return null;
  }

  const counters = {};
  Object.values(data).forEach(entry => {
      const [action, datetime] = entry.split(' -- | ');
      const [dayOfWeek, date] = datetime.split(', ');
      const [month, day, year] = date.split(' ');
      const [time, meridiem] = datetime.split(' at ')[1].split(' ');
      const [hour, minutes] = time.split(':');
      const key = `${day} ${month}, ${year}`;
      const hourKey = `${day} ${month}, ${year}, ${hour}`;
      counters[key] = counters[key] || { Controller: 0, Finger: 0, EnterAdminMenu: 0, HourlyCounts: {} };
      counters[key].HourlyCounts[hourKey] = counters[key].HourlyCounts[hourKey] || { Controller: 0, Finger: 0, EnterAdminMenu: 0 };
      if (action.startsWith('Controller')) {
          counters[key].Controller++;
          counters[key].HourlyCounts[hourKey].Controller++;
      } else if (action.startsWith('Finger')) {
          counters[key].Finger++;
          counters[key].HourlyCounts[hourKey].Finger++;
      } else if (action.startsWith('EnterAdminMenu')) {
          counters[key].EnterAdminMenu++;
          counters[key].HourlyCounts[hourKey].EnterAdminMenu++;
      }
  });
  return counters;
}

// API endpoint to get action counts by day, hour, and year
app.get('/api/action-counts-by-day-hour-year', async (req, res) => {
  const counters = await countActionsByDayHourAndYear();
  if (!counters) {
      res.status(500).json({ error: 'Error fetching data from API' });
      return;
  }
  res.json(counters);
});
// Count occurrences of actions by day and year based on fetched data
async function countActionsByDayAndYear() {
    const data = await fetchDataFromApi();
    if (!data) {
        return null;
    }

    const counters = {};
    Object.values(data).forEach(entry => {
        const [action, datetime] = entry.split(' -- | ');
        const [dayOfWeek, date] = datetime.split(', ');
        const [month, day, year] = date.split(' ');
        const [time, meridiem] = datetime.split(' at ')[1].split(' ');
        const key = `${day} ${month}, ${year}`;
        counters[key] = counters[key] || { Controller: 0, Finger: 0, EnterAdminMenu: 0, KeyCard: 0, ExitDoor: 0 };
        if (action.startsWith('Controller')) {
            counters[key].Controller++;
        } else if (action.startsWith('Finger')) {
            counters[key].Finger++;
        } else if (action.startsWith('EnterAdminMenu')) {
            counters[key].EnterAdminMenu++;
        } else if (action.startsWith('KeyCard')) {
            counters[key].KeyCard++;
        } else if (action.startsWith('Leave')) {
            counters[key].ExitDoor++;
        }
    });
    return counters;
}

// API endpoint to get chart data for action counts by day and year
app.get('/api/chart-data-by-day-year', async (req, res) => {
    const counters = await countActionsByDayAndYear();
    if (!counters) {
        res.status(500).json({ error: 'Error fetching data from API' });
        return;
    }
    const labels = Object.keys(counters);
    const controllerData = labels.map(label => counters[label].Controller);
    const fingerData = labels.map(label => counters[label].Finger);
    const enterAdminMenuData = labels.map(label => counters[label].EnterAdminMenu);
    const keyCardData = labels.map(label => counters[label].KeyCard);
    const exitDoorData = labels.map(label => counters[label].ExitDoor);
    res.json({ labels, controllerData, fingerData, enterAdminMenuData, keyCardData, exitDoorData });
});

// Start the server
app.listen(port, () => {
    console.log(`API server is running on http://localhost:${port}`);
});
