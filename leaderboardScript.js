let spreadsheet_logURLs = "https://sheets.googleapis.com/v4/spreadsheets/1mnNMUB2xT5jROylK7DU8p09ODtcHuq4RM1sAYpPtDZM/values/Sheet1!A1:A100?key=AIzaSyD0TtPDhKvjoN5b7flK6QyQCmpbqcUvRAM";
let spreadsheet_bench = "https://sheets.googleapis.com/v4/spreadsheets/182RUS6YB9Boi6rGn6fS13P79lfCviN84m3rtSByCUdM/values/Sheet1?key=AIzaSyD0TtPDhKvjoN5b7flK6QyQCmpbqcUvRAM";
let logData = [];
let benchData = [];
let benchProfession = 0; //Column A in Google Sheets
let benchAverageDPS = 2; //Column C in Google Sheets 
let playerID = 0;
let dmgType = "";
let playerClass = [];
let quickID = 1187;
let alacID = 30328;
let gw2BuildNr = 175086; // change if balance patch or relevant fixes happened


createPlayerVariables();

async function createPlayerVariables() {
    await getURL();
    await getBench();

    for (let i = 0; i < logData.length; i++) {
        //create shortened account name (minus .####)
        logData[i].shortAccName = logData[i].account.substring(0, logData[i].account.length - 5);

        //create dmgType variable
        if (logData[i].dpsTargets[0][0].condiDps > logData[i].dpsTargets[0][0].powerDps) {
            logData[i].dmgType = "Condition";
        } else {
            logData[i].dmgType = "Power";
        }

        //create boonGiver variable (quick, alac or empty)
        //maybe give every player an empty string here: logData[i].boonGiver = ""; 
        //so that I can delete the else parts of the if-statements below 
        logData[i].boonGiver = "";

        //edge-case: boon chronomancer gives self-alacrity even if quickness-build?
        for (let j = 0; j < logData[i].buffUptimes.length; j++) {
            if (Object.keys(logData[i].buffUptimes[j].buffData[0].generated)[0] != "Technician" &&
                Object.keys(logData[i].buffUptimes[j].buffData[0].generated)[0] != "Mechanikerin") {
                if (logData[i].buffUptimes[j].id == quickID) {
                    logData[i].boonGiver = "Quickness ";
                } else if (logData[i].buffUptimes[j].id == alacID) {
                    logData[i].boonGiver = "Alacrity ";
                }
            }
        }

        // define build name
        logData[i].buildName = logData[i].dmgType + " " + logData[i].boonGiver + logData[i].profession + " ";

        for (let k = 0; k < benchData.length; k++) {
            if (logData[i].buildName == benchData[k][benchProfession]) {
                logData[i].benchPerc = (logData[i].dpsTargets[0][0].dps / Number(benchData[k][benchAverageDPS]) * 100).toFixed(2);
            }
        }
    }

    //sort by highest benchmark percentage
    logData.sort((a, b) => b.benchPerc - a.benchPerc || isNaN(a.benchPerc) - isNaN(b.benchPerc));
    fillTable();
}

function createBenchPercString(benchPerc) {
    if (isNaN(benchPerc)) {
        benchPerc = "<nobr>---</nobr>";
    } else {
        benchPerc += "%";
    }
    return benchPerc;
}

async function fillTable() {
    // create and fill table

    let leaderboardDPS = "<table class = 'leaderboardTable'>";
    let leaderboardBoon = "<table class = 'leaderboardTable'>";
    let nrOfBoonDps = 0;
    let nrOfDps = 0;

    for (let i = 0; i < logData.length; i++) {
        if (logData[i].boonGiver == "") {
            leaderboardDPS +=
                "<tr>" +
                "<td>" + (nrOfDps + 1) + "</td>" +
                "<td>" + logData[i].shortAccName + "</td>" +
                "<td>" + logData[i].buildName + "</td>" +
                "<td>" + logData[i].dpsTargets[0][0].dps + "</td>" +
                "<td>" + createBenchPercString(logData[i].benchPerc) + "</td>" +
                "<td class='logLink'> <a target='_blank' rel='noopener noreferrer' href = '" + logData[i].permalink +"'>" + "<img src='log_icon_01.svg' alt='Log Icon' style='width:20%'></img>" + "</a> </td>" +
                "</tr>"
            nrOfDps += 1;
        } else {
            leaderboardBoon +=
                "<tr>" +
                "<td>" + (nrOfBoonDps + 1) + "</td>" +
                "<td>" + logData[i].shortAccName + "</td>" +
                "<td>" + logData[i].buildName + "</td>" +
                "<td>" + logData[i].dpsTargets[0][0].dps + "</td>" +
                "<td>" + createBenchPercString(logData[i].benchPerc) + "</td>" +
                "<td class='logLink'> <a target='_blank' rel='noopener noreferrer' href = '" + logData[i].permalink +"'>" + "<img src='log_icon_01.svg' alt='Log Icon' style='width:20%'></img>" + "</a> </td>" +
                "</tr>"
            nrOfBoonDps += 1;
        }

    }

    leaderboardDPS += "</table>";
    leaderboardBoon += "</table";

    let leaderboardTables = document.getElementsByClassName("leaderboard_table");
    leaderboardTables[0].innerHTML = leaderboardDPS;
    leaderboardTables[1].innerHTML = leaderboardBoon;



}

async function getBench() {
    let response = await fetch(spreadsheet_bench);
    let object = await response.text();

    let jsonObject = JSON.parse(object);

    // console.log(jsonObject.values[0][benchProfession]);
    for (let i = 0; i < jsonObject.values.length; i++) {
        benchData.push(jsonObject.values[i]);
    }
}

async function getURL() {

    let response = await fetch(spreadsheet_logURLs);
    let object = await response.text();

    let jsonObject = JSON.parse(object);

    for (let i = 0; i < jsonObject.values.length; i++) {
        await getLog(jsonObject.values[i]);
    }


}

async function getLog(permalink) {
    const getJSONURL = "https://dps.report/getJSON?permalink=";
    let fetchURL = getJSONURL + permalink;

    let myObject = await fetch(fetchURL);
    let myText = await myObject.text();

    let secObject = JSON.parse(myText);

    if (Number(secObject.gW2Build) >= gw2BuildNr) {
        secObject.players[playerID].permalink = permalink;
        logData.push(secObject.players[playerID]);
    }
}

