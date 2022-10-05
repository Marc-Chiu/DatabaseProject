"use strict";
(function() {

  var today = new Date();
  var monthAgo = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0');
  var xx = String(today.getMonth()).padStart(2, '0');
  var yyyy = today.getFullYear();

  if (xx == "00"){
    monthAgo = today.getFullYear()-1 + '-' + "12" + '-' + dd;
  } else {
    monthAgo = yyyy + '-' + xx + '-' + dd;
  }
  today = yyyy + '-' + mm + '-' + dd;

  window.addEventListener("load", init);

  /**
   * main, list of eventlisteners
   */
  function init() {
    myFlights();
    id("Create-btn").addEventListener("click", () => { toggle_screen("Create", "Stats", "Home");});
    id("Stats-btn").addEventListener("click", () => {
      toggle_screen("Stats", "Create", "Home");
      getStats();
    });
    id("Home-btn").addEventListener("click", () => {
      toggle_screen("Home","Stats", "Create");
      myFlights();
    });
    id("search-flights-btn").addEventListener("click", myFlights);
    id("edit-btn").addEventListener("click", submitEdit);
    id("stat-btn").addEventListener("click", getSold);
    id("customer-btn").addEventListener("click", getUserFlights);
    id("Logout-btn").addEventListener("click", logout);
  }

  // toggle between pages
  function toggle_screen(page1, page2, page3) {
    clear();
    id(page1+"-btn").classList.add("hidden");
    id(page2+"-btn").classList.remove("hidden");
    id(page3+"-btn").classList.remove("hidden");
    id(page1).classList.remove("hidden");
    id(page2).classList.add("hidden");
    id(page3).classList.add("hidden");
  }

  // clears the pages and makes things hidden that should be hidden
  function clear() {
    while (id("Flights").firstChild) {
      id("Flights").removeChild(id("Flights").firstChild);
    }
    while (id("Comments").firstChild) {
      id("Comments").removeChild(id("Comments").firstChild);
    }
    while (id("Customers-Flights-Table").firstChild) {
      id("Customers-Flights-Table").removeChild(id("Customers-Flights-Table").firstChild);
    }
  //id("Customer").innerHTML = "";
    //id("Top-Destinations").innerHTML = "";
    id("end-date").value ='';
    id("start-date").value='';
    id("edit").classList.add("hidden");

    id("y1").innerText = "";
    id("y2").innerText = "";
    id("y3").innerText = "";
    id("m1").innerText = "";
    id("m2").innerText = "";
    id("m3").innerText = "";
    id("chart-div").classList.add("hidden");
  }

 /**
   * loads airlines/staff flights onto the page
   * @param {json} data of flights
   */
  function loadMyFlights(data){
    clear();
    console.log(data);
    console.log(data.length);

    for(let i = 0; i < data.length; i++){
      let flight = document.createElement("tr");
      flight.classList.add("flights");
      console.log(data[i]);
      for(let elem in data[i]){
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
      let edit = document.createElement("button");
      edit.addEventListener("click", editFlight);
      edit.innerText = "edit";
      flight.appendChild(edit);
      let view_comments = document.createElement("button");
      view_comments.addEventListener("click", comments);
      view_comments.innerText = "comments";
      flight.appendChild(view_comments);
      id("Flights").appendChild(flight);
    }
  }

  //get staff/airline flights to then load, fetch requeset
  function myFlights(){
    let params = new FormData();
    // Add the various parameters to the FormData object

    let end = today;
    let start = monthAgo;
    if (id("start-date").value && id("end-date").value && id("From").value && id("To").value){
      end = id("end-date").value;
      start = id("start-date").value;
      params.append("Start", start);
      params.append("end", end);
      params.append("From", id("From").value);
      params.append("To", id("To").value);
      fetch("/search-staff", {method: "POST", body: params})
      .then(statusCheck)
      .then(resp => resp.json()) // or this if your data comes in JSON
      .then(loadMyFlights)
      .catch(console.error);
    }
    else {
      params.append("Start", start);
      params.append("end", end);
      fetch("/airline-flights", {method: "POST", body: params})
      .then(statusCheck)
      .then(resp => resp.json()) // or this if your data comes in JSON
      .then(loadMyFlights)
      .catch(console.error);
    }

  }

  // revelas edit a flights status input onto the page
  function editFlight(){
    let array = Array.from(this.parentNode.children);
    console.log(array);
    id("edit").classList.remove("hidden");
    id("edit-airline").value = array[1].innerText;
    id("edit-dep-date").value = array[2].innerText;
    id("edit-dep-time").value = array[3].innerText;
    id("edit-flight-num").value = array[0].innerText;

  }

  //  edits a flights status
  function submitEdit(){
    let params = new FormData();
    // Add the various parameters to the FormData object

    params.append("airline", id("edit-airline").value);
    params.append("date", id("edit-dep-date").value);
    params.append("time", id("edit-dep-time").value);
    params.append("flight-num", id("edit-flight-num").value);
    params.append("status", id("edit-status").value);
    fetch("/edit-status", {method: "POST", body: params})
    .then(statusCheck)
    .catch(console.error);
    clear();
  }

  // load revenue onto html page
  function loadRevenue(data){
    console.log(data[1][0]["revenue"]);

    console.log(id("y1").innerText);

    id("y1").innerText = data[0][0]["revenue"];
    id("y2").innerText = data[2][0]["revenue"];
    id("y3").innerText = data[4][0]["revenue"];
    id("m1").innerText = data[1][0]["revenue"];
    id("m2").innerText = data[3][0]["revenue"];
    id("m3").innerText = data[5][0]["revenue"];

  }

  // load top destination onto html page
  function loadDestination(data){
    console.log(data[1][0]["arrival_airport"]);

    if (data[0].length > 0){
      id("dest-m1").innerText = data[0][0]["arrival_airport"];
    }
    if (data[0].length > 1){
      id("dest-m2").innerText =  data[0][1]["arrival_airport"];
    }
    if (data[0].length > 2){
      id("dest-m3").innerText =  data[0][2]["arrival_airport"];
    }

    if (data[1].length > 0){
      id("dest-y1").innerText = data[1][0]["arrival_airport"];
    }
    if (data[1].length > 1){
      id("dest-y2").innerText = data[1][1]["arrival_airport"];
    }
    if (data[1].length > 2){
      id("dest-y3").innerText = data[1][2]["arrival_airport"];
    }
  }

  // load reports onto html page
  function loadReports(data){
    id("chart-div").classList.remove("hidden");
    var xValues = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var yValues = [0,0,0,0,0,0,0,0,0,0,0,0];

    let sum = 0;
    for(let i=0; i<data.length; i++) {
      sum += 1;
      yValues[parseInt(data[i]["purchase_date"].substr(5,7))-1] +=  1;
    }
    console.log(yValues);
    console.log(sum);

    id("tickets-sold").innerText = "Tickets Sold " + sum.toString();

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
          text: "Sold"
        }
      }
    });

  }

  // post request to get tickets sold
  function getSold(){

    let params = new FormData();
    let end = id("stat-end-date").value;
    let start = id("stat-start-date").value;
    params.append("Start", start);
    params.append("end", end);
    fetch("/view-sold", {method: "POST", body: params})
    .then(statusCheck)
    .then(resp => resp.json()) // or this if your data comes in JSON
    .then(loadReports)
    .catch(console.error);
  }

  // load top user into the html page
  function loadUsers(data){
    console.log(data);
    id("top-customer").innerText = "Top   Customer  With  " + data[0]["flights"] + "  Flights:  " + data[0]["email"];
  }

  // multiple get requests to get all the stats data necessary for the html page
  function getStats(){

    fetch("/view-revenue")
      .then(statusCheck)
      .then(resp => resp.json()) // or this if your data comes in JSON
      .then(loadRevenue)
      .catch(console.error)

    fetch("/top-customer")
    .then(statusCheck)
    .then(resp => resp.json()) // or this if your data comes in JSON
    .then(loadUsers)
    .catch(console.error);

    fetch("/top-destination")
    .then(statusCheck)
    .then(resp => resp.json()) // or this if your data comes in JSON
    .then(loadDestination)
    .catch(console.error);

  }

  // load a user flights he has purchased onto the page
  function loadUserFlights(data){
    console.log(data);
    console.log(data.length);

    clear();

    for(let i = 0; i < data.length; i++){
      let flight = document.createElement("tr");
      flight.classList.add("flights");
      console.log(data[i]);
      for(let elem in data[i]){
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
      id("Customers-Flights-Table").appendChild(flight);
    }
  }

  // get a user flights he has purchased
  function getUserFlights(){
    let params = new FormData();;
    params.append("email", id("customer-search").value);
    fetch("/all-customers-flights", {method: "POST", body: params})
    .then(statusCheck)
    .then(resp => resp.json()) // or this if your data comes in JSON
    .then(loadUserFlights)
    .catch(console.error);
  }

  // logout and go back to home page
  function logout(){
    fetch("/Logout")
    .then(statusCheck)
    .catch(console.error);
    clear();
    window.location.href = "/index.html";
  }


  function loadComments(data){
    id("Comments").innerText = "";
    console.log(data);

    for(let i = 0; i < data.length; i++){
      let comments = document.createElement("tr");
      comments.classList.add("comments");
      let comment = document.createElement("td");
      comment.innerText = data[i]["comments"];
      let rating = document.createElement("td");
      rating.innerText = data[i]["rating"];
      comments.appendChild(comment);
      comments.appendChild(rating);
      id("Comments").appendChild(comments);
    }
  }

  function comments(){
    let array = Array.from(this.parentNode.children);
    let params = new FormData();;
    params.append("flight_num", array[0].innerText);
    params.append("airline_name", array[1].innerText);
    params.append("departure_date", array[2].innerText);
    params.append("departure_time", array[3].innerText);
    fetch("/getComments", {method: "POST", body: params})
    .then(statusCheck)
    .then(resp => resp.json()) // or this if your data comes in JSON
    .then(loadComments)
    .catch(console.error);
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
