var w1 = window;
w1.addEventListener("load", ClientInitialization, false);
w1.addEventListener("beforeunload", ClientExit, false);

var timems = 1200000;
var timerId = setTimeout(LogOffByTimeout, timems);

function LogOffByTimeout() {
    document.getElementById('logoutForm').submit()
}

//якщо юзер активний - перевстановити лічилиник часу після якого відбудеться покидання чату.
function OnUserActivity() {
    clearTimeout(timerId);
    timerId = setTimeout(LogOffByTimeout, timems);
}


var lost_x = -1; //последнее значение позиции курсора по горизонту
var lost_y = -1; //последнее значение позиции курсора по вертикали

function mouseChangePos(e) {
    //Получаем координаты мыши.
    if (document.all) //Для IE
    {
        x = event.x + document.body.scrollLeft;
        y = event.y + document.body.scrollTop;
    }
    else {
        x = e.pageX;
        y = e.pageY;
    }

    if (lost_x != -1 && lost_y != -1) /*Если координаты, не равны значению установленному по умолчанию*/ {
        if (lost_x != x || lost_y != y) /*Если координаты не равны своей прошлой позиции*/ {
            OnUserActivity(); /*То вызываем желаемую функцию, которая должна вызываться при движении мыши*/
            lost_x = -1; /* Присваиваем значения координатам по умолчанию. Сделано чтобы событие не вызывалось несколько раз*/
            lost_y = -1;
        }
    }
    else /*Иначе, устанавливаем переменным прошлым координатам, значения текущих координат*/ {
        lost_x = x;
        lost_y = y;
    }
}




//масиви для зберігання останніх ajax запитів (
//потрібен, щоб запити можна було відмінити у випадку покидання сторінки)
var Commands = [
  [],
  [],
  []
];
function DeleteCommandFromArray(n) {
    if (Commands[n] != null)
    {
        Commands[n].pop();
    }
}
//відміна ajax запитів, коли юзер покидає сторінку
function ClearCommands() {
    for (var i = 0; i < Commands.length; i++) {
        for (var j = 0; j < Commands[i].length; j++) {
            Commands[i][j].abort();
            Commands[i][j] = null;
        }
    }
}


//передача данних (Sender, Receiver) витягуючи їх значення з форми для відправки повідомлень.
//залежно від цих данних, в контролері визначається тип діалогу.
function ClientInitialization() {
    var Participants =
        {
            'Sender': $("#Sender").val(),
            'Receiver': $("#Receiver").val()
        };
    var url = './ClientRegistration';
    $.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(Participants),
        contentType: "application/json; charset=utf-8",
        //async: true,
        //timeout: 660000,
        success: function () {
            WaitForCommandToUpdateChat();
            WaitForCommandToUpdateUserActivityInViews();
            WaitForCommandToUpdateIndicatorsOfUnreadMessagesInViews();
        }
        //error: function (xhr, status, error) {
        //    alert("ошибка ClientInitialization: ");
        //    alert(xhr.responseText + '|\n' + status + '|\n' + error);
        //}
    });
}
//відправка ajax запиту, який відповідальний за оновлення вікна чату, списку юзерів, списку чат кімнат
function WaitForCommandToUpdateChat() {
    var url = './WaitForCommand';
    var ClientSendRequestData =
    {
        Sender: $("#Sender").val(),
        Receiver: $("#Receiver").val()
    };

    var xhr1 = $.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(ClientSendRequestData),
                contentType: "application/json; charset=utf-8",
                success: function () {
                    DeleteCommandFromArray(0);

                    UpdateChatDiv($("#Receiver").val());
                    UpdateListOfUsersDiv($("#Receiver").val());
                    UpdateListOfChatRoomsDiv();
                    WaitForCommandToUpdateChat();
                },
                //error: function (xhr, status, error) {
                //    alert("ошибка WaitForCommand: ");
                //    alert(xhr.responseText + '|\n' + status + '|\n' + error);
                //}
    });

    //оновлення масиву актуальним запитом
    Commands[0].push(xhr1);
}
//відправка ajax запиту, який відповідальний за відображення статусу юзера (чи він натискає на клавіші)
function WaitForCommandToUpdateUserActivityInViews() {
    var url = './WaitForCommandToUpdateUserActivityInViews';
    var ClientSendRequestData =
    {
        Sender: $("#Sender").val(),
        Receiver: $("#Receiver").val()
    };

    var xhr2 = $.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(ClientSendRequestData),
                contentType: "application/json; charset=utf-8",
                success: function () {
                    DeleteCommandFromArray(1);
                    UpdateUserActivity($("#Receiver").val());
                },
                //error: function (xhr, status, error) {
                //    alert("ошибка WaitForCommandToUpdateUserActivityInViews: ");
                //    alert(xhr.responseText + '|\n' + status + '|\n' + error);
                //}
    });
    //оновлення масиву актуальним запитом
    Commands[1].push(xhr2);
}
//відправка ajax запиту, який відповідальний за відображення наявності непрочитаних повідомлень
function WaitForCommandToUpdateIndicatorsOfUnreadMessagesInViews() {
    var url = './WaitForCommandToUpdateIndicatorsOfUnreadMessagesInViews';
    var ClientSendRequestData =
    {
        Sender: $("#Sender").val(),
        Receiver: $("#Receiver").val()
    };

    var xhr3 = $.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(ClientSendRequestData),
                contentType: "application/json; charset=utf-8",
                success: function () {
                    DeleteCommandFromArray(2);

                    UpdateListOfUsersDiv($("#Receiver").val());
                    UpdateListOfChatRoomsDiv();
                    WaitForCommandToUpdateIndicatorsOfUnreadMessagesInViews();
                },
                //error: function (xhr, status, error) {
                //    alert("ошибка WaitForCommandToUpdateIndicatorsOfUnreadMessagesInViews: ");
                //    alert(xhr.responseText + '|\n' + status + '|\n' + error);
                //}
    });
    //оновлення масиву актуальним запитом
    Commands[2].push(xhr3);
}

//завантаження відповідних повідомлень у розділ переписки
function UpdateChatDiv(receiver) {
    $("#Chat").load("/Home/ChatRoom?Receiver=" + receiver);
    setTimeout(scrollToDown, 200);
};
function scrollToDown() {
    var objDiv = document.getElementById("Chat");
    var scrollHeight = Math.max(
      objDiv.scrollHeight, objDiv.offsetHeight, objDiv.clientHeight
    );
    objDiv.scrollTop = objDiv.scrollHeight;
}

//завантаження активних юзерів у відповідну мітку
function UpdateUserActivity(receiver) {
    $("#InfoAboutActiveUsers").load("/Home/RegisterActiveUserAndGetAllActiveUsersNames?Receiver=" + receiver);
    WaitForCommandToUpdateUserActivityInViews();
};

//відправка повідомлення після натискання на кнопку
document.getElementById('btnSend').onclick = function () {
    
    var testData =
        {
            'Sender': $("#Sender").val(),
            'Receiver': $("#Receiver").val(),
            'Text': $("#Text").val()
        };

    $.ajax({
        type: "POST",
        url: "/Home/SaveNewMessageInDatabase",
        data: JSON.stringify(testData),
        contentType: "application/json; charset=utf-8",
        //error: function (xhr, status, error) {
        //    alert(xhr.responseText + '|\n' + status + '|\n' + error);
        //}
    });

    document.getElementById("Text").value = "";
};

//реєстрація активності юзера по зміні координат миші
document.onmousemove = function (event) {
    mouseChangePos(event);
};

//відправка інформації для відображення активності юзера після натискання на клавішу
document.getElementById('Text').onkeypress = function () {
    OnUserActivity();

    var testData =
        {
            'Sender': $("#Sender").val(),
            'Receiver': $("#Receiver").val(),
        };

    $.ajax({
        type: "POST",
        url: "/Home/ProcessKeypressFromUser",
        data: JSON.stringify(testData),
        contentType: "application/json; charset=utf-8",
        //error: function (xhr, status, error) {
        //    alert(xhr.responseText + '|\n' + status + '|\n' + error);
        //}
    });
};

function insertTextAtCursor(el, text, offset) {
    var val = el.value, endIndex, range, doc = el.ownerDocument;
    if (typeof el.selectionStart == "number"
            && typeof el.selectionEnd == "number") {
        endIndex = el.selectionEnd;
        el.value = val.slice(0, endIndex) + text + val.slice(endIndex);
        el.selectionStart = el.selectionEnd = endIndex + text.length + (offset ? offset : 0);
    } else if (doc.selection != "undefined" && doc.selection.createRange) {
        el.focus();
        range = doc.selection.createRange();
        range.collapse(false);
        range.text = text;
        range.select();
    }
}

function GetMessageIdToQuote(SenderName, Text) {
    event.preventDefault();
    insertTextAtCursor(document.getElementById('Text'), '[quoteAuthor]' + SenderName + '[/quoteAuthor]' + '[quoteText]' + Text + '[/quoteText]');
};


//#region JS Emotion Icon Actions
document.getElementById('gifAcute').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[acute]'); };
document.getElementById('gifAggressive').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[aggressive]'); };
document.getElementById('gifAir_kiss').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[air_kiss]'); };
document.getElementById('gifAngel').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[angel]'); };
document.getElementById('gifBad').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[bad]'); };
document.getElementById('gifBb').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[bb]'); };
document.getElementById('gifBeach').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[beach]'); };
document.getElementById('gifBeee').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[beee]'); };
document.getElementById('gifBig_boss').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[big_boss]'); };
document.getElementById('gifBlum').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[blum]'); };
document.getElementById('gifBlush').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[blush]'); };
document.getElementById('gifBoast').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[boast]'); };
document.getElementById('gifBomb').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[bomb]'); };
document.getElementById('gifBoredom').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[boredom]'); };
document.getElementById('gifBye').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[bye]'); };
document.getElementById('gifClapping').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[clapping]'); };
document.getElementById('gifCray').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[cray]'); };
document.getElementById('gifCrazy').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[crazy]'); };
document.getElementById('gifCurtsey').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[curtsey]'); };
document.getElementById('gifDance').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[dance]'); };
document.getElementById('gifDash').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[dash]'); };
document.getElementById('gifDeclare').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[declare]'); };
document.getElementById('gifDiablo').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[diablo]'); };
document.getElementById('gifDirol').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[dirol]'); };
document.getElementById('gifDon-t_mention').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[don-t_mention]'); };
document.getElementById('gifDownload').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[download]'); };
document.getElementById('gifDrinks').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[drinks]'); };
document.getElementById('gifEnglish_en').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[english_en]'); };
document.getElementById('gifFirst_move').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[first_move]'); };
document.getElementById('gifFlirt').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[flirt]'); };
document.getElementById('gifFocus').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[focus]'); };
document.getElementById('gifFool').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[fool]'); };
document.getElementById('gifFriends').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[friends]'); };
document.getElementById('gifGamer2').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[gamer2]'); };
document.getElementById('gifGamer4').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[gamer4]'); };
document.getElementById('gifGirl_blum').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[girl_blum]'); };
document.getElementById('gifGirl_cray').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[girl_cray]'); };
document.getElementById('gifGirl_crazy').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[girl_crazy]'); };
document.getElementById('gifGirl_dance').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[girl_dance]'); };
document.getElementById('gifGirl_devil').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[girl_devil]'); };
document.getElementById('gifGirl_drink').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[girl_drink]'); };
document.getElementById('gifGirl_drink1').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[girl_drink1]'); };
document.getElementById('gifGirl_haha').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[girl_haha]'); };
document.getElementById('gifGirl_hide').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[girl_hide]'); };
document.getElementById('gifGirl_hospital').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[girl_hospital]'); };
document.getElementById('gifGirl_impossible').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[girl_impossible]'); };
document.getElementById('gifGirl_in_love').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[girl_in_love]'); };
document.getElementById('gifGirl_mad').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[girl_mad]'); };
document.getElementById('gifGirl_pinkglassesf').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[girl_pinkglassesf]'); };
document.getElementById('gifGirl_sad').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[girl_sad]'); };
document.getElementById('gifGirl_sigh').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[girl_sigh]'); };
document.getElementById('gifGirl_smile').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[girl_smile]'); };
document.getElementById('gifGirl_wacko').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[girl_wacko]'); };
document.getElementById('gifGirl_wink').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[girl_wink]'); };
document.getElementById('gifGirl_witch').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[girl_witch]'); };
document.getElementById('gifGive_heart').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[give_heart]'); };
document.getElementById('gifGive_rose').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[give_rose]'); };
document.getElementById('gifGood').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[good]'); };
document.getElementById('gifHeart').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[heart]'); };
document.getElementById('gifHeat').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[heat]'); };
document.getElementById('gifHelp').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[help]'); };
document.getElementById('gifHi').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[hi]'); };
document.getElementById('gifHunter').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[hunter]'); };
document.getElementById('gifHysteric').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[hysteric]'); };
document.getElementById('gifI-m_so_happy').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[i-m_so_happy]'); };
document.getElementById('gifIreful').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[ireful]'); };
document.getElementById('gifKing').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[king]'); };
document.getElementById('gifKiss').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[kiss]'); };
document.getElementById('gifLaugh').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[laugh]'); };
document.getElementById('gifLazy').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[lazy]'); };
document.getElementById('gifLol').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[lol]'); };
document.getElementById('gifMail').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[mail]'); };
document.getElementById('gifMamba').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[mamba]'); };
document.getElementById('gifMan_in_love').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[man_in_love]'); };
document.getElementById('gifMda').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[mda]'); };
document.getElementById('gifMega_shok').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[mega_shok]'); };
document.getElementById('gifMoil').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[moil]'); };
document.getElementById('gifMosking').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[mosking]'); };
document.getElementById('gifMusic').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[music]'); };
document.getElementById('gifNea').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[nea]'); };
document.getElementById('gifNegative').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[negative]'); };
document.getElementById('gifNew_russian').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[new_russian]'); };
document.getElementById('gifOk').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[ok]'); };
document.getElementById('gifOn_the_quiet').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[on_the_quiet]'); };
document.getElementById('gifPadonak').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[padonak]'); };
document.getElementById('gifPaint').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[paint]'); };
document.getElementById('gifPardon').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[pardon]'); };
document.getElementById('gifParting').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[parting]'); };
document.getElementById('gifParty').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[party]'); };
document.getElementById('gifPilot').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[pilot]'); };
document.getElementById('gifPleasantry').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[pleasantry]'); };
document.getElementById('gifPopcorm').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[popcorm]'); };
document.getElementById('gifPrankster').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[prankster]'); };
document.getElementById('gifPreved').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[preved]'); };
document.getElementById('gifPunish').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[punish]'); };
document.getElementById('gifRofl').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[rofl]'); };
document.getElementById('gifRtfm').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[rtfm]'); };
document.getElementById('gifRussian_ru').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[russian_ru]'); };
document.getElementById('gifSad').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[sad]'); };
document.getElementById('gifSarcastic').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[sarcastic]'); };
document.getElementById('gifSarcastic_blum').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[sarcastic_blum]'); };
document.getElementById('gifSarcastic_hand').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[sarcastic_hand]'); };
document.getElementById('gifScare').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[scare]'); };
document.getElementById('gifScaut').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[scaut]'); };
document.getElementById('gifScratch_one-s_head').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[scratch_one-s_head]'); };
document.getElementById('gifSearch').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[search]'); };
document.getElementById('gifSecret').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[secret]'); };
document.getElementById('gifShok').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[shok]'); };
document.getElementById('gifShout').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[shout]'); };
document.getElementById('gifSmile').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[smile]'); };
document.getElementById('gifSmoke').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[smoke]'); };
document.getElementById('gifSoldier').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[soldier]'); };
document.getElementById('gifSoldier_girl').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[soldier_girl]'); };
document.getElementById('gifSorry').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[sorry]'); };
document.getElementById('gifSpiteful').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[spiteful]'); };
document.getElementById('gifSpruce_up').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[spruce_up]'); };
document.getElementById('gifSuperstition').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[superstition]'); };
document.getElementById('gifSwoon').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[swoon]'); };
document.getElementById('gifTease').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[tease]'); };
document.getElementById('gifTender').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[tender]'); };
document.getElementById('gifThank_you').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[thank_you]'); };
document.getElementById('gifThis').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[this]'); };
document.getElementById('gifTo_become_senile').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[to_become_senile]'); };
document.getElementById('gifTo_take_umbrage').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[to_take_umbrage]'); };
document.getElementById('gifTraining').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[training]'); };
document.getElementById('gifTreaten').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[treaten]'); };
document.getElementById('gifUmnik').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[umnik]'); };
document.getElementById('gifUnknw').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[unknw]'); };
document.getElementById('gifVampire').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[vampire]'); };
document.getElementById('gifVava').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[vava]'); };
document.getElementById('gifVictory').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[victory]'); };
document.getElementById('gifWacko').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[wacko]'); };
document.getElementById('gifWhistle').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[whistle]'); };
document.getElementById('gifWink').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[wink]'); };
document.getElementById('gifWizard').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[wizard]'); };
document.getElementById('gifYahoo').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[yahoo]'); };
document.getElementById('gifYes').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[yes]'); };
document.getElementById('gifYu').onclick = function () { insertTextAtCursor(document.getElementById('Text'), '[yu]'); };
//#endregion

function ClientExit() {
    var Participants =
        {
            'Sender': $("#Sender").val(),
            'Receiver': $("#Receiver").val()
        };
    var url = './ClientExit';
    $.ajax({
        type: "POST",
        url: url,
        data: JSON.stringify(Participants),
        contentType: "application/json; charset=utf-8",
        //error: function (xhr, status, error) {
        //    alert("ошибка ClientInitialization: ");
        //    alert(xhr.responseText + '|\n' + status + '|\n' + error);
        //}
    });

    ClearCommands();
}

function UpdateListOfUsersDiv(receiver) {
    $("#ListOfUsers").load("/Home/ListOfUsers?Receiver=" + receiver);
};
function UpdateListOfChatRoomsDiv() {
    $("#ListOfChatRooms").load("/Home/ListOfChatRooms");
};

document.getElementById('editMessage').onclick = function (event) {
    event.preventDefault();
    var MsgId = $(this).data('msgid');
    ShowModalDialogToEditMessage(MsgId);
};
function ShowModalDialogToEditMessage(Id) {
    event.preventDefault();
    var url = "/Home/EditMessageText?MsgId=" + Id;
    $.get(url, function (data) {
        $('#editMsgContainer').html(data);
        $('#editMsgModal').modal('show');
    });
};
