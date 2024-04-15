const express = require('express');
const app = express();
const moment = require('moment');
const port = 3000;
const cors = require('cors');

app.use(cors());
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.get('/amt/all', async (req, res) => {
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
app.get('/amt/day/all', async (req, res) => {
    
        const currentDate = await moment().format('dddd, MMMM DD YYYY');
        console.log(currentDate);
        const todayData = await fetch(`http://localhost:3000/amt/day/${currentDate}`);
        const data = await todayData.json();
        res.send(data);
});

// Define your API endpoint
app.get('/getDay', (req, res) => {
    // Get the current date
    const currentDate = moment().format('dddd, MMMM DD YYYY');

    // Send the formatted date as the response
    res.send(currentDate);
});


app.get('/amt/day/:day', async (req, res) => {
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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});