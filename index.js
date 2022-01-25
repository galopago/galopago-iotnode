const express = require('express')
const path = require('path')
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 5000

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {rejectUnauthorized: false}
});

express()
  .use(bodyParser.json())
  .get('/', async (req, res) => {
    // Display all the database content in web page
    try {
      const client = await pool.connect();

      // Get all data from the database
      const result = await client.query('SELECT id, sensor_id, temperature_ext, temperature_int, battery, timestamp FROM readings');
      const results = result.rows;
      
      // Make the web page using the data
      var readings =``;
      results.forEach(elm => {
        readings +=  `
        <tr>
          <td>${elm.id}</td>
          <td>${elm.sensor_id}</td>
          <td>${elm.temperature_ext}</td>
          <td>${elm.temperature_int}</td>
          <td>${elm.battery}</td>
          <td>${elm.timestamp}</td>
        </tr>`
      });

      var content = `
      <!DOCTYPE html>
      <html>
        <head>
        </head>
      <body>
        <div class="container">
          <h2>Database Results</h2>
          <table cellspacing="5" cellpadding="5">
            <tr>
              <th>ID</th>
              <th>Sensor_id</th>
              <th>Temperature_ext (°C)</th>
              <th>Temperature_int (°C)</th>
              <th>Battery (V)</th>
              <th>Timestamp</th>
            </tr>
            ${readings}
          </table>
        </div>
      </body>
      </html>
      `;

      res.send(content);
      client.release();
    } catch (err) {
      console.error(err);
      res.status(500).send("Error " + err);
      client.release();
    }
  })
  .post('/dbpost', async (req, res) => {
    // Receive incoming requests from the ESP32 iot-node+ and insert the data into a PostgreSQL database
    try {
      const client = await pool.connect();

	  var arrsize=req.body.length;
	  for(i=0;i<arrsize;i++)
	  {
	  	var sensor_id = req.body[i].sensor_id;
	  	var temperature_ext = req.body[i].temperature_ext;
	  	var temperature_int = req.body[i].temperature_int;
	  	var battery = req.body[i].battery;
	  	
	  	var timestamp = await client.query("SELECT (CURRENT_TIMESTAMP(0) AT TIME ZONE 'ACT')::text;");
	  	var ts = timestamp.rows[0].timezone;
	  	
	  	client.query(`INSERT INTO readings (sensor_id,temperature_ext,temperature_int,battery,timestamp) VALUES ('${sensor_id}', '${temperature_ext}', '${temperature_int}', '${battery}', '${ts}');`
      , (err, res) => {
        	try {
          	if (err) throw err;
        	} catch {
          	console.error("Can't insert the data to database");
        	}
      	});
      
	  }
      //var sensor_id = req.body.sensor_id;
      //var sensor_id = req.body[0].sensor_id;
      //var temperature_ext = req.body.temperature_ext;
      //var temperature_ext = req.body[0].temperature_ext;
      //var temperature_int = req.body.temperature_int;
      //var temperature_int = req.body[0].temperature_int;
	  //var battery = req.body.battery;
      //var battery = req.body[0].battery;
      
      
      //var timestamp = await client.query("SELECT (CURRENT_TIMESTAMP(0) AT TIME ZONE 'ACT')::text;");
      //var ts = timestamp.rows[0].timezone;

      
      res.sendStatus(200);
      client.release();
    } catch (err) {
      console.error(err);
      res.status(500).send("Error " + err);
      client.release();
    }
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));
