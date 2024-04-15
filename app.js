const express = require('express');
const cors = require('cors');
const moment = require('moment');

const app = express();
const port = 3000;

app.use(cors());

// API endpoint URLs
const apiUrl = 'https://esp32test-trigger-default-rtdb.asia-southeast1.firebasedatabase.app/AllHis.json';

// Fetch data from the API endpoint
async function fetchDataFromApi(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data from API:', error);
        return null;
    }
}

// Count occurrences of actions by day, hour, and year based on fetched data
async function countActionsByDayHourAndYear(data) {
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
app.get("/", (req, res) => {
    res.send("Express on Vercel");
});
// API endpoint to get action counts by day, hour, and year
app.get('/api/action-counts-by-day-hour-year', async (req, res) => {
    const data = await fetchDataFromApi(apiUrl);
    const counters = await countActionsByDayHourAndYear(data);
    if (!counters) {
        res.status(500).json({ error: 'Error fetching data from API' });
        return;
    }
    res.json(counters);
});

// Count occurrences of actions by day and year based on fetched data
async function countActionsByDayAndYear(data) {
    if (!data) {
        return null;
    }

    const counters = {};
    Object.values(data).forEach(entry => {
        const [action, datetime] = entry.split(' -- | ');
        const [dayOfWeek, date] = datetime.split(', ');
        const [month, day, year] = date.split(' ');
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
    const data = await fetchDataFromApi(apiUrl);
    const counters = await countActionsByDayAndYear(data);
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

// Get current date in the desired format
function getCurrentDate() {
    return moment().format('dddd, MMMM DD YYYY');
}

// API endpoint to get the current date
app.get('/api/get-current-date', (req, res) => {
    const currentDate = getCurrentDate();
    res.send(currentDate);
});
app.get('/api/amt/all', async (req, res) => {
    try {
        // Fetch data from the Firebase Realtime Database endpoint
        const response = await fetch('https://esp32test-trigger-default-rtdb.asia-southeast1.firebasedatabase.app/AllHis.json');

        // Check if the response is successful
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        // Parse the JSON response
        const data = await response.json();

        // Filter out items that include "DoorNotClose"
        const filteredData = Object.keys(data).reduce((acc, key) => {
            if (!data[key].includes('DoorNotClose')) {
                acc[key] = data[key];
            }
            return acc;
        }, {});

        // Count the number of items in the filtered data
        const count = Object.keys(filteredData).length;

        // Send the count as the response
        res.json({ count });
    } catch (error) {
        // Handle any errors that occurred during the fetch
        console.error('Error fetching data:', error);
        res.status(500).send('Error fetching data');
    }
});
app.get('/api/amt/day/all', async (req, res) => {

    const currentDate = await moment().format('dddd, MMMM DD YYYY');
    console.log(currentDate);
    const todayData = await fetch(`https://api.vishsiri.space/api/amt/day/${currentDate}`);
    const data = await todayData.json();
    res.send(data);
});

// Define your API endpoint
app.get('/api/getDay', (req, res) => {
    // Get the current date
    const currentDate = moment().format('dddd, MMMM DD YYYY');

    // Send the formatted date as the response
    res.send(currentDate);
});
app.get('/api/amt/day/:day', async (req, res) => {
    const day = req.params.day;
    try {
        // Fetch data from the Firebase Realtime Database endpoint
        const response = await fetch('https://esp32test-trigger-default-rtdb.asia-southeast1.firebasedatabase.app/AllHis.json');

        // Check if the response is successful
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        // Parse the JSON response
        const data = await response.json();

        // Filter data for today based on the date format
        const todayData = Object.keys(data).reduce((acc, key) => {
            if (data[key].includes(day)) {
                acc[key] = data[key];
            }
            return acc;
        }, {});

        // Filter out items that include "DoorNotClose"
        const filteredData = Object.keys(todayData).reduce((acc, key) => {
            if (!todayData[key].includes('DoorNotClose')) {
                acc[key] = todayData[key];
            }
            return acc;
        }, {});

        // Count the number of items in the filtered data
        const count = Object.keys(filteredData).length;


        // Send the count as the response
        res.json({ count });
    } catch (error) {
        // Handle any errors that occurred during the fetch
        console.error('Error fetching data:', error);
        res.status(500).send('Error fetching data');
    }
});
// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Export the Express API
module.exports = app;