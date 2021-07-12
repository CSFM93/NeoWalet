var socket = io();

window.addEventListener('load', function () {
  var form = document.getElementById('formAddAccount')

  // console.log(getData())

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var inputWIF = document.getElementById('inputWIF')
    if (inputWIF.value) {
      let data = getData()
      let payload = {
        userId: data.userId,
        platform: data.platform,
        WIF: inputWIF.value
      }
      let message = JSON.stringify(payload)
      // console.log(payload)
      socket.emit('addAccount', message);
      inputWIF.value = '';
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

  socket.on('addAccountState', function (msg) {
    // console.log('addAccountState', msg)
    let WIFAdded = msg
    if (WIFAdded) {
      JSAlert.alert("WIF added successfully").dismissIn(1000 * 4);;
    } else {
      JSAlert.alert("Please try again").dismissIn(1000 * 4);;
    }
  });

})