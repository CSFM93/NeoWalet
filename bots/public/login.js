var socket = io();

window.addEventListener('load', function () {
    var form = document.getElementById('formAddAccount')


    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var inputPassword = document.getElementById('inputPassword')
        if (inputPassword.value) {
            let data = getData()
            let payload = {
                userId: data.userId,
                platform: data.platform,
                password: inputPassword.value
            }
            let message = JSON.stringify(payload)
            // console.log('payload', payload)
            socket.emit('login', message);
            inputPassword.value = '';
        }
    });

    function getData() {
        const queryString = window.location.search;
        // console.log(queryString)
        let data = queryString.replace("?", "").replace("&", "=").split("=")
        // console.log(data)
        let userId = data[1]
        let platform = data[3]

        let payload = {
          userId,
          platform
        }
        // console.log(payload)
        return payload
    }

    socket.on('loginState', function (msg) {
        // console.log('loginState', msg)
        let loginSuccessful = msg
        if (loginSuccessful) {
            JSAlert.alert("Logged in successfully").dismissIn(1000 * 2);;
        } else {
            JSAlert.alert("Please try again").dismissIn(1000 * 2);;
        }
    });
    getData()

})