let loggedIn = false;
let loggedUser = "";

const users = (function () {
    let json = null;
    $.ajax({
        'async': false,
        'global': false,
        'url': "./users.json",
        'dataType': "json",
        'success': function (data) {
            json = data;
        }
    });
    return json;
})();

$(function () {

    setInterval(() => {
        showCurrentTime()
    }, 1000);

    manageOrderForm();

    $('#datepicker').datepicker({
        buttonText: '',
        defaultDate: 1,
        changeMonth: true,
        changeYear: true,
        minDate: 0
    });

    $('#timepicker').timepicker({
        timeFormat: 'HH:mm',
        interval: 60,
        minTime: '7',
        maxTime: '22:00',
        startTime: '7:00',
        dynamic: false,
        dropdown: true,
        scrollbar: true
    });

    handleLogin();

});

function showCurrentTime() {
    const today = new Date()
    const currentDate = today.toLocaleDateString('pl-pl', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const currentDateCapitalized = currentDate.charAt(0).toUpperCase() + currentDate.slice(1);
    const currentTime = today.toLocaleTimeString('pl-pl');

    $('.current-date').text(currentDateCapitalized + ', ' + currentTime);
}

function manageOrderForm() {

    $('#order-form').steps({
        headerTag: 'h2',
        bodyTag: "section",
        transitionEffect: 'fade',
        enableAllSteps: false,
        autoFocus: true,
        transitionEffectSpeed: 500,
        titleTemplate: '<span class="title">#title#</span>',
        stepsOrientation: 0,
        actionContainerTag: "buttons",
        enableFinishButton: false,
        labels: {
            previous: 'Wstecz',
            next: 'Dalej',
            finish: 'Potwierdzam rezerwację',
            current: ''
        },
        onStepChanging: function (event, currentIndex, newIndex) {

            if (newIndex < currentIndex) {
                return true;
            }

            if (!loggedIn) {
                $("#loginModal").modal('show');
                return false;
            }


            var destination = $('#flight').val();
            var persons = $('#persons').val();
            var datepicker = $('#datepicker').val();
            var timepicker = $('#timepicker').val();
            var luggage = $('#luggage').val();
            var place = $('#place').val();
            var payment = $('#payment').val();

            if ( (currentIndex === 0 && (!destination || !persons || !datepicker || !timepicker || timepicker == 'Wybierz godzinę'))
             || (currentIndex === 1 && (!luggage || !place))
             || (currentIndex === 2 && !payment) ) {
                $('.flight-data-error').show();
                return false;
            }


            getFlight(destination, datepicker);

            getUserData(loggedUser);
            $('.flight-data-error').hide();
            return true;

        }
    })

}

function handleLogin() {
    $('.login-button').on('click', (e) => {
        // e.preventDefault();
        var login = $('#login').val();
        var password = $('#password').val();

        if (credentialsCorrect(login, password)) {
            loggedIn = true;
            loggedUser = login
            $('.login-error').hide();
            $('#loginModal').modal('hide');
            return true;
        } else {
            $('.login-error').show();
        }

        return false;
    });

}

function credentialsCorrect(login, password) {
    if (!login || !password) {
        return false;
    }

    for (const iter in users) {
        if (users[iter].login === login && users[iter].password === password) {
            return true;
        }
    }
    return false;

}


function getFlight(destination, strDate) {
    const splittedDate = strDate.split(".");
    const departureAt = splittedDate[2] + "-" + splittedDate[1];

    const settings = {
        "async": true,
        "crossDomain": true,
        "url": "https://travelpayouts-travelpayouts-flight-data-v1.p.rapidapi.com/v1/prices/direct/?destination=" + destination + "&origin=KTW&currency=pln&departure_at=" + departureAt + "&sorting=price&one_way=true",
        "method": "GET",
        "error": function (XMLHttpRequest, textStatus, errorThrown) {
            addFlightBoxError();
        },
        "headers": {
            "X-Access-Token": "b8852ed331920625b19d59f0a0094286",
            "X-RapidAPI-Key": "fef57bac93msh9943a6ab8665f72p1a89e7jsn93c527c0fb55",
            "X-RapidAPI-Host": "travelpayouts-travelpayouts-flight-data-v1.p.rapidapi.com"
        }
    };

    $('.flight-info').html("");


    $.ajax(settings).done(function (response) {
        const flights = response.data[destination];

        for (let iter in flights) {
            var flight = flights[iter];
            addFlightBox(flight, iter);
        }
    });

    $('.flight-wrapper').show();
}

function addFlightBoxError() {
    $('.flight-info').html("<p class='flight-error'>Niestety nic nie znaleziono</p>");
}

function addFlightBox(flight, iter) {
    let flightTemplate = $('.flight-template').html();

    flightTemplate = flightTemplate.replace("__DEPARTURE__", parseDate(flight.departure_at));
    flightTemplate = flightTemplate.replace("__PRICE__", flight.price);
    flightTemplate = flightTemplate.replace("__ARRIVAL__", parseDate(flight.return_at));
    flightTemplate = flightTemplate.replace("__NUMBER__", flight.flight_number);
    if (iter == 0) {
        flightTemplate = flightTemplate.replace("__CLASS__", "active flight0");
    } else {
        flightTemplate = flightTemplate.replace("__CLASS__", "flight" + iter);
    }

    $('.flight-info').append(flightTemplate);
    var destination = $('#flight').val();
    $('.plane-img').attr("src", "images/" + destination + ".jpg");

    $('a', '.flight-info').click(setActiveFlight());

}

function setActiveFlight() {
    let selectedA = $(this);
    $('.flight-info a').each(
        function(i) {
            $($('.flight-info a').get(i)).removeClass("active");
        });
    selectedA.addClass("active");

}

function parseDate(jsonDate) {
    var date = new Date(jsonDate);
    var strDate = date.toLocaleDateString("pl-PL");
    strDate += " " + date.toLocaleTimeString("pl-PL");
    return strDate;
}


function getUserData(username) {
    const user = users.filter(function (data) {
        return data.login === username
    })[0];
    $("#fullname-val").text(user.fullname);
    $("#phone-val").text(user.phone);
    $("#email-val").text(user.email);
    $("#ilosob-val").text($('#persons').val());
    $("#payment-val").text($('#payment').val());
}
