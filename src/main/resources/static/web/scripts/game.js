
$(document).ready(function(){

    $('#errorDiv').hide();
    $('#savePositionsDiv').hide();

    let gamePlayerId = GetQueryString();
    console.log(gamePlayerId);

    $.ajax({url: makeUrl(gamePlayerId.gp),
            statusCode: {
                401: function () {
                    console.log( "unauthorized" );
                    hideAllBecauseErrorAndShowErrorDiv();
                    handleError(401);

                },
                403: function() {
                    console.log( "log in first" );
                    hideAllBecauseErrorAndShowErrorDiv();
                    handleError(403);
                }
            },
            success: function(result){
                console.log(result);
                printGamePage(result, gamePlayerId.gp);
    }});
});

function logout() {
    $.post("/api/logout")
        .done(function() { window.location = '/web/games.html' });
}

function hideAllBecauseErrorAndShowErrorDiv() {
    $('#logout-form').hide();
    $('#gameNo').hide();
    $('#twoGrids').hide();
    $('#errorDiv').show();
}

function handleError(code) {
    if (code == 401){
        $('#errorMsg').append('Error code: ' + code + ', you are unauthorized.');
    } else if (code == 403) {
        $('#errorMsg').append('Error code: ' + code + ', please go back to game list site and log in first.');
    }

}

function printGamePage(data, gpId){

    let playerId = getPlayerId(data,gpId);
    let enemyId = getEnemyId(data,gpId);

    header(data, gpId);

    createGameStateTable(data);

    if(data.ships.length > 0){
        hidePlacingShipsDivs();
    }

    printGrid('#grid');
    if (enemyExist(data)){
        printGrid('#salvoGrid');
    } else {
        $('#playerTwo').hide();
    }
    markGrids(data, gpId);

    activateSendShipLocationsButton();

    // save turnNo in salvoGrid element
    saveTurnNoInGrid(data, gpId);
    console.log("tunrNo: " + $('#s0').data('turnNo'));

    let shipsLocationArray = markShips(data);
    markSalvos(data, playerId, 'owner', shipsLocationArray);
    markSalvos(data, enemyId, 'enemy', shipsLocationArray);

}

window.GetQueryString = function(q) {
    let vars = [], hash;
    let hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(let i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars[hash[0]] = hash[1];
    }
    return vars;
};

function makeUrl(playerID) {
    return 'http://localhost:8080/api/game_view/' + playerID;
}

function getPlayerId(data, gpId) {
    return (gpId == data.gamePlayers[0].id) ? data.gamePlayers[0].player.id : data.gamePlayers[1].player.id;
}

function enemyExist(data) {
    // console.log((data.gamePlayers.length == 2) ? true : false);
    return (data.gamePlayers.length > 1);
}

function getEnemyId(data, gpId) {
    if (enemyExist(data)) {
        return (gpId == data.gamePlayers[0].id) ? data.gamePlayers[1].player.id : data.gamePlayers[0].player.id;
    } else {
        return null;
    }

}

function header(dataFromAjaxCall, gamePlayerId) {

    $('#gameNo').append('<h2>Game id: '+ dataFromAjaxCall.gameId + ' , Created:  '
        + new Date(dataFromAjaxCall.created) + '</h2>');
    $('#gameNo').append('<p id="p1">Player One: ' + dataFromAjaxCall.gamePlayers[0].player.email + '</p>');
    if (enemyExist(dataFromAjaxCall)){
        $('#gameNo').append('<p id="p2">Player Two: ' + dataFromAjaxCall.gamePlayers[1].player.email + '</p>');
    } else {
        $('#gameNo').append('<p id="p2">Player Two: N/A</p>');
    }


    if (gamePlayerId == dataFromAjaxCall.gamePlayers[0].id){
        $('#p1').append('<span>(you)</span>').addClass('bold');
    } else {
        $('#p2').append('<span>(you)</span>').addClass('bold');
    }

}

function activateSendShipLocationsButton(){
    $('#savePositions').on("click", function (e){

        e.preventDefault();
        let gpID = GetQueryString();
        let url = "/api/games/players/" + gpID.gp + "/ships";
        let receivedDataToSend = $('#savePositions').data('dataToSend');
        console.log(receivedDataToSend);

        $.post({
            url: url,
            data: JSON.stringify(receivedDataToSend),
            dataType: "text",
            contentType: "application/json"
        })
            .done(function(resp) {
                // console.log("ship added");
                // console.log(resp);
                window.location = "/web/game.html?gp=" + gpID.gp;

            })
            .fail(function(resp){
                console.log(resp);
                alert('Something went wrong!');
            });
    });

}

function showButtonAndHandleSendingSalvoesData(salvoesArray){

    $('#saveLocationDiv').show();
    $('#saveLocationButton').unbind( "click" ).on('click', function(e) {

        // e.preventDefault();
        // e.stopPropagation();

        let turnNo = $('#s0').data('turnNo');
        console.log({turnNumber: turnNo, locations: salvoesArray});
        let dataToSend = {turnNumber: turnNo, locations: salvoesArray};
        console.log(JSON.stringify(dataToSend));

        let gpID = GetQueryString();
        let url = "/api/games/players/" + gpID.gp + "/salvos";

        $.post({
            url: url,
            data: JSON.stringify(dataToSend),
            dataType: "text",
            contentType: "application/json"
        })
            .done(function(resp) {
                // console.log("salvoes added");
                // console.log(resp);
                window.location = "/web/game.html?gp=" + gpID.gp;

            })
            .fail(function(resp){
                console.log(resp);
                alert('Something went wrong!');
            });

    });

}

function printGrid(elementID) {

    let vertical = ['','A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

    for (let r = 0; r < 11; r++) {
        let column = "";
        let horizontalPosition = 0;

        for (let c = 0; c < 11; c++) {
            if (r == 0 & c > 0){
                column += "<td class='gridNames'>" + c + "</td>";
            } else if (r > 0 & c == 0) {
                column += "<td class='gridNames'>" + vertical[r] + "</td>";
            } else if (elementID == '#grid'){
                column += "<td id='" + vertical[r] + horizontalPosition + "'></td>";
            } else if (elementID == '#salvoGrid'){
                column += "<td id='s" + vertical[r] + horizontalPosition + "'></td>";
            }
            horizontalPosition++;
        }
        $(elementID).append("<tr id='" + vertical[r] + "'>" + column + "</tr>");
    }
}

function markGrids(dataFromAjaxCall, gamePlayerId) {
    if (gamePlayerId == dataFromAjaxCall.gamePlayers[0].id){
        $('#gridOne').append('<p>' + dataFromAjaxCall.gamePlayers[0].player.email + '(you)</p>').addClass('bold');
        if (enemyExist(dataFromAjaxCall)) {
            $('#gridTwo').append('<p>' + dataFromAjaxCall.gamePlayers[1].player.email + '</p>');
        }
    } else {
        $('#gridOne').append('<p>' + dataFromAjaxCall.gamePlayers[1].player.email + '(you)</p>').addClass('bold');
        $('#gridTwo').append('<p>' + dataFromAjaxCall.gamePlayers[0].player.email + '</p>');
    }
}

function markShips(data) {

    let shipsLocations = [];
    data.ships.forEach((ship) => {
        ship.locations.forEach((location) => {
            $('#' + location).addClass('playersShip')
                .append(giveShipTypeShortcut(ship.shipType));
            shipsLocations.push(location);
        });
    });

    // console.log('shipsLocations: ' + shipsLocations);
    return shipsLocations;
}

function markSalvos(data, pID, playerType, shipsLocations) {

    let salvoLocations = {};
    data.salvoes.forEach((salvo) => salvoLocations[salvo.turnNo] = []);
    data.salvoes.forEach((salvo) => {
        if (pID === salvo.playerId){
            salvo.locations.forEach((location) => salvoLocations[salvo.turnNo].push(location));
        }
    });
    console.log("salvos: " + playerType + " / " + JSON.stringify(salvoLocations));

    for (let key in salvoLocations){
        salvoLocations[key].forEach((location) => {
            if (playerType === 'owner'){
                $('#s' + location).addClass('playersSalvo').append(key);
            } else {
                if (shipsLocations.includes(location)){
                    console.log('hit: ' + location);
                    $('#' + location).addClass('enemysSalvoHit').append(key);
                } else {
                    $('#' + location).addClass('enemysSalvo').append(key);
                }
            }
        });
    }
}

function hidePlacingShipsDivs(){
    $('#savePositionsDiv').hide();
    $('#shipChoose').hide();
    $('#orientationChoose').hide();
    $('#doubleClickInfo').hide();
}

function saveTurnNoInGrid(data, gpID) {

    let turnNo = 1;
    let turnNoArray = [];
    let playerID = getPlayerId(data, gpID);

    if (data.salvoes.length > 0){
        data.salvoes.forEach((salvo) => {
            if(playerID === salvo.playerId){
                turnNoArray.push(salvo.turnNo);
            }
        });
        turnNoArray.sort((a, b) => b - a);
        turnNo = (turnNoArray[0] + 1);
    }

    $('#s0').data('turnNo', turnNo);
}


