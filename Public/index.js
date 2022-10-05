"use strict";

(function() {

  window.addEventListener("load", init);

  /**
   * main, list of eventlisteners
   */
  function init() {
    clear();
    id("Login-btn").addEventListener("click", () => { toggle_screen("Login", "Register", "Home");});
    id("Register-btn").addEventListener("click", () => { toggle_screen("Register", "Login", "Home");});
    id("Home-btn").addEventListener("click", () => { toggle_screen("Home","Login", "Register");});
    id("trip-type").addEventListener("change", () => {
      id("end-date").classList.toggle("hidden");
      id("end-label").classList.toggle("hidden");
    });
    id("Registration-type").addEventListener("change", () => {
      id("customer-info").classList.toggle("hidden");
      id("staff-info").classList.toggle("hidden");
    });
    id("Login-type").addEventListener("change", () => {
      id("userLogin").classList.toggle("hidden");
      id("staffLogin").classList.toggle("hidden");
    });
    id("search-flights").addEventListener("click", getFlights);
  }

  // toggle between pages
  function toggle_screen(page1, page2, page3) {
    id(page1+"-btn").classList.add("hidden");
    id(page2+"-btn").classList.remove("hidden");
    id(page3+"-btn").classList.remove("hidden");
    id(page1).classList.remove("hidden");
    id(page2).classList.add("hidden");
    id(page3).classList.add("hidden");
    clear();
  }

  //clear the page
  function clear(){
    let parent = id("flights");
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }
  }

 // load the flight information onto the page
 function load_flights(data) {
    console.log(data);
    id("flights").innerHTML = "";

    if (data.length > 1){
      for(let i = 0; i < data.length; i++){
        let flight = document.createElement("tr");
        flight.classList.add("flights");
        console.log(data[i]);
        for(let elem in data[i][0]){
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
        id("flights").appendChild(flight);
      }
    } else {
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
        id("flights").appendChild(flight);
      }
    }
  }

// post request to backend to get flights
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
