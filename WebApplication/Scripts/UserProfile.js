document.getElementById('btnChangeTimeZone').onclick = function () {
    var testData =
        {
            'TimeZoneId': $('#TimeZoneId').val()
        };
    var objCUN = document.getElementById("ColoredUserName");

    $.ajax({
        type: "POST",
        url: "/Home/ChangeTimeZone",
        data: JSON.stringify(testData),
        contentType: "application/json; charset=utf-8",
        //error: function (xhr, status, error) {
        //    alert(xhr.responseText + '|\n' + status + '|\n' + error);
        //}
    });
};

document.getElementById('ColorTypeId').addEventListener("change", function (result) {
    var objCUN = document.getElementById("ColoredUserName");
    var objCUNTemplate = document.getElementById("ColoredUserNameTemplate");
    var e = document.getElementById("ColorTypeId");
    var fontColor = e.options[e.selectedIndex].value;
    objCUN.innerHTML = "<b><font color='" + fontColor + "'</font>" + objCUNTemplate.innerHTML + ":" + fontColor + "</b>";
});

document.getElementById('btnChangeColorOfLogin').onclick = function () {
    var testData =
        {
            'ColorHex': $('#ColorTypeId').val()
        };
    var objCUN = document.getElementById("ColoredUserName");
    $.ajax({
        type: "POST",
        url: "/Home/ChangeColorOfLogin",
        data: JSON.stringify(testData),
        contentType: "application/json; charset=utf-8",
        //error: function (xhr, status, error) {
        //    alert(xhr.responseText + '|\n' + status + '|\n' + error);
        //}
    });
};

function ShowModalDialogToInviteUsersToChatRoom(ChatRoomGuid) {
    event.preventDefault();
    var url = "/Home/InviteUsersToChatRoom?ChatRoomGuid=" + ChatRoomGuid;
    $.get(url, function (data) {
        $('#inviteUsersContainer').html(data);
        $('#inviteUsersModal').modal('show');
    });
};