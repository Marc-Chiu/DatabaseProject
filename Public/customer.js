"use strict";
(function() {
  var today = new Date();
  var yearAgo = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var yyyy = today.getFullYear();
  var xxxx = today.getFullYear()-1;

  today = yyyy + '-' + mm + '-' + dd;
  yearAgo = xxxx + '-' + mm + '-' + dd;


  window.addEventListener("load", init);

  /**
   * main, list of eventlisteners
   */
  function init() {
   // clear();
    id("Flights-btn").addEventListener("click", () => {
      clear();
      id("Flights").classList.toggle("hidden");
      id("Home").classList.toggle("hidden");
      id("Flights-btn").classList.toggle("hidden");
      id("Home-btn").classList.toggle("hidden");
      id("Spent-btn").classList.toggle("hidden");
      id("Spent").classList.toggle("hidden");
      MyFlights();
    });
    id("trip-type").addEventListener("change", () => {
      id("end-date").classList.toggle("hidden");
      id("end-label").classList.toggle("hidden");
    });
    id("Home-btn").addEventListener("click", () => {
      clear();
      id("Flights").classList.toggle("hidden");
      id("Home").classList.toggle("hidden");
      id("Flights-btn").classList.toggle("hidden");
      id("Home-btn").classList.toggle("hidden");
      id("Spent-btn").classList.toggle("hidden");
      id("Spent").classList.add("hidden");
    });
    id("Spent-btn").addEventListener("click", () => {
      clear();
      id("Flights").classList.toggle("hidden");
      id("Home").classList.toggle("hidden");
      id("Flights-btn").classList.toggle("hidden");
      id("Home-btn").classList.toggle("hidden");
      id("Spent-btn").classList.toggle("hidden");
      id("Spent").classList.toggle("hidden");
      spent();
    });
    id("Logout-btn").addEventListener("click", logout);
    id("search-btn").addEventListener("click", getFlights);
    id("spent-btn").addEventListener("click", spent);
    id("Comment-btn").addEventListener("click", comment);
  }

  // clears the pages and makes things hidden that should be hidden
  function clear() {
    while (id("search-flights").firstChild) {
      id("search-flights").removeChild(id("search-flights").firstChild);
    }
    while (id("Tickets").firstChild) {
      id("Tickets").removeChild(id("Tickets").firstChild);
    }
    while (id("Current").firstChild) {
      id("Current").removeChild(id("Current").firstChild);
    }
    while (id("Past").firstChild) {
      id("Past").removeChild((id("Past").firstChild));
    }
    id("Spent").classList.add("hidden");
    id("card-info").classList.add("hidden");
    id("comments-section").classList.add("hidden");
  }

  /**
   * loads flights onto the page
   * @param {json} data of flights
   */
  function load_my_flights(data){
    console.log(data[0].length);

    clear();

    let found_flight = false
    for(let i = 0; i < data.length; i++){
      if (data[i].length != 0) {found_flight = true;}
      let flight = document.createElement("tr");
      flight.classList.add("flights");
      let ticket_id = document.createElement("td");
      ticket_id.innerText = data[i]["ticket_id"];
      flight.appendChild(ticket_id);

      if (found_flight){
        if (today < data[i]["departure_date"].substr(0,10)) {
          let cancel = document.createElement("button");
          cancel.addEventListener("click", cancelTicket);
          cancel.innerText = "cancel";
          flight.appendChild(cancel);
          id("Current").appendChild(flight);
        } else {
          let comment = document.createElement("button");
          comment.addEventListener("click", getComment);
          comment.innerText = "comment";
          flight.appendChild(comment);
          id("Past").appendChild(flight);
        }
      }
      found_flight = false;
    }
  }


  //get customers flights to then load, fetch requeset
  function MyFlights(){
    console.log("loading");
    fetch("/MyFlights")
      .then(statusCheck)
      .then(resp => resp.json()) // or this if your data comes in JSON
      .then(load_my_flights)
      .catch(console.error);
  }

 /**
   * loads flights onto the page
   * @param {json} data of tickets
   */
  function loadTickets(data) {
    id("search-flights").innerHTML = "";
    let length = data.length;
    console.log(data);
    console.log("loading tickets");

    let found_ticket = false;
    for(let i = 0; i < length; i++){
      let flight = document.createElement("tr");
      flight.classList.add("tickets");
      for(let elem in data[i]){
        found_ticket = true;
        let row = document.createElement("td");
        if (elem == "departure_date" || elem == "arrival_date") {
          row.innerHTML = data[i][elem].substr(0,10);
        } else {
          row.innerHTML = data[i][elem];
        }
        flight.appendChild(row);
      }
      if (found_ticket){
        let tickets = document.createElement("button");
        tickets.addEventListener("click", purchaseTicket);
        tickets.innerText = "Purchase";
        flight.appendChild(tickets);
        id("Tickets").appendChild(flight);
      }
     found_ticket = false;
    }
  }

  // when ticket button is clicked get ticket data fetch request
  function getTickets(){
    console.log("loading");
    let params = new FormData();
    let row = this.parentNode;
    let index = [];
    for (let i = 0; i < row.children.length; i++) {
      index.push(row.children[i].innerText);
    }
    console.log(index);

    //Add the various parameters to the FormData object
    params.append("flight_num", index[0]);
    params.append("airline_name", index[1]);
    params.append("departure_date", index[2]);
    params.append("departure_time", index[3]);
    fetch("/Tickets", {method: "POST", body: params})
      .then(statusCheck)
      .then(resp => resp.json()) // or this if your data comes in JSON
      .then(loadTickets)
      .catch(console.error);
  }


 /**
 * loads flights onto the page
 * @param {json} data of flights
 */
 function load_flights(data) {
  console.log(data);
  clear();
  let length = data.length;
  console.log(length);

  let found_flight = false;
  if (data.length > 1){
    for(let i = 0; i < data.length; i++){
      let flight = document.createElement("tr");
      flight.classList.add("flights");
      console.log(data[i]);
      for(let elem in data[i][0]){
        found_flight = true;
        console.log(elem);
        console.log(data[i][0][elem]);
        let row = document.createElement("td");
        if (elem == "departure_date" || elem == "arrival_date") {
          row.innerText = data[i][0][elem].substr(0,10);
        } else {
          row.innerText = data[i][0][elem];
        }
        flight.appendChild(row);
        console.log(row);
      }
      if(found_flight) {
        let tickets = document.createElement("button");
        tickets.addEventListener("click", getTickets);
        tickets.innerText = "tickets";
        flight.appendChild(tickets);
        id("search-flights").appendChild(flight);
      }
      found_flight = false
    }
  }
  else {
    for(let i = 0; i < data.length; i++){
      let flight = document.createElement("tr");
      flight.classList.add("flights");
      console.log(data[i]);
      for(let elem in data[i]){
        found_flight = true;
        console.log(elem);
        console.log(data[i][elem]);
        let row = document.createElement("td");
        if (elem == "departure_date" || elem == "arrival_date") {
          row.innerText = data[i][elem].substr(0,10);
        } else {
          row.innerText = data[i][elem];
        }
        flight.appendChild(row);
        console.log(row);
      }
      if(found_flight) {
        let tickets = document.createElement("button");
        tickets.addEventListener("click", getTickets);
        tickets.innerText = "tickets";
        flight.appendChild(tickets);
        id("search-flights").appendChild(flight);
      }
      found_flight = false
      }
    }
  }

  // post request to backend to get flights searched for post request
  function getFlights(){
    console.log("loading");
    let params = new FormData();
    let row = this.parentNode;
    let index = [];
    for (let i = 0; i < row.children.length; i++) {
      index.push(row.children[i].value);
    }
    console.log(index);

    //Add the various parameters to the FormData object
    params.append("From", index[1]);
    params.append("To", index[2]);
    params.append("Start", index[4]);
    params.append("end", index[6]);
    fetch("/search", {method: "POST", body: params})
      .then(statusCheck)
      .then(resp => resp.json()) // or this if your data comes in JSON
      .then(load_flights)
      .catch(console.error);
  }


  // logout go back to home page
  function logout(){
    fetch("/Logout")
    .then(statusCheck)
    .catch(console.error);
    clear();
    window.location.href = "/index.html";
  }

  // post request to cancel a users tickets
  function cancelTicket() {
    // cancel tickets
    let params = new FormData();
    // Add the various parameters to the FormData object
    params.append("ticket-id", this.parentNode.firstChild.innerText);
    fetch("/Cancel", {method: "POST", body: params})
      .then(statusCheck)
      .then(() => {
        clear();
        id("Flights").classList.toggle("hidden");
        id("Home").classList.toggle("hidden");
        id("Flights-btn").classList.toggle("hidden");
        id("Home-btn").classList.toggle("hidden");
      })
      .catch(console.error);
  }

  // reveal purchase info inputs onto the page
  function purchaseTicket() {
    clear();
    id("card-info").classList.remove("hidden");
    id("ticket-id").value = this.parentNode.firstChild.innerText;
  }


   /**
   * loads spending data onto the page
   * @param {json} data of flights
   */
  function load_spending(data){
    console.log(data[0]);

    var xValues = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var yValues = [0,0,0,0,0,0,0,0,0,0,0,0];

    let sum = 0;
    for(let i=0; i<data.length; i++) {
      sum = sum + data[i]["sold_price"];
      yValues[parseInt(data[i]["purchase_date"].substr(5,7))-1] +=  data[i]["sold_price"];
    }
    console.log(yValues);
    console.log(sum);

    id("total-spent").innerText = "Total Spent " + sum;

    let myChart = new Chart("myChart", {
      type: "bar",
      data: {
        labels: xValues,
        datasets: [{
          backgroundColor: "black",
          data: yValues
        }]
      },
      options: {
        legend: {display: false},
        title: {
          display: true,
          text: "Spent"
        }
      }
    });
  }


  // fetch request to retrieve spending data
  function spent() {
    let params = new FormData();
    // Add the various parameters to the FormData object

    let end = today;
    let start = yearAgo;
    if (id("spent-start-date").value && id("spent-end-date").value){
      end = id("spent-end-date").value;
      start = id("spent-start-date").value ;
    }
    console.log(start, end);

    params.append("start", start);
    params.append("end", end);
    fetch("/Spending", {method: "POST", body: params})
    .then(statusCheck)
    .then(resp => resp.json()) // or this if your data comes in JSON
    .then(load_spending)
    .catch(console.error);
  }


  // fetch request to load comments into the database
  function comment() {
    let params = new FormData();
    // Add the various parameters to the FormData object
    params.append("ticket-id", id("comment-label").innerText);
    params.append("rating", id("rating").value);
    params.append("comment", id("comments-input").value);
    fetch("/Rate", {method: "POST", body: params})
      .then(statusCheck)
      .then(() => {
        clear();
        // id("Flights").classList.toggle("hidden");
        // id("Home").classList.toggle("hidden");
        // id("Flights-btn").classList.toggle("hidden");
        // id("Home-btn").classList.toggle("hidden");
      })
      .catch(console.error);
      id("comments-section").classList.add("hidden");
      console.log("here");
  }

  //reveal comment inputs onto the page
  function getComment(){
    id("comments-section").classList.remove("hidden");
    id("comment-label").innerText = this.parentNode.firstChild.innerText
  }


  /**
   * helper func
   * @param {string} id id of elem
   * @returns {dom} dom element
   */
  function id(id) {
    return document.getElementById(id);
  }


  async function statusCheck(response) {
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response;
  }

})();
