var w1 = window;
w1.addEventListener("load", ClientInitialization, false);
w1.addEventListener("beforeunload", ClientExit, false);
//$(window).bind('beforeunload', ClientExit);


$.xhrPool = {};
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
function ClearCommands() {
    for (var i = 0; i < Commands.length; i++) {
        for (var j = 0; j < Commands[i].length; j++) {
            Commands[i][j].abort();
            Commands[i][j] = null;
        }
    }
}


//передавати данні (Sender, Receiver) витягуючи їх значення з форми для відправки повідомлень.
//залежно від цих данних, в контролері визначити тип діалогу.
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
            //WaitForCommandToUpdateUserStatusInViews();
        },
        //error: function (xhr, status, error) {
        //    alert("ошибка ClientInitialization: ");
        //    alert(xhr.responseText + '|\n' + status + '|\n' + error);
        //}
    });
}
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
                    //alert("Прибыли данные: " + data);
                    DeleteCommandFromArray(0);

                    UpdateChatDiv($("#Receiver").val());
                    UpdateListOfUsersDiv($("#Receiver").val());
                    UpdateListOfChatRoomsDiv();
                    WaitForCommandToUpdateChat();
                    //setTimeout(WaitForCommandToUpdateChat, 200, result);
                },
                //error: function (xhr, status, error) {
                //    alert("ошибка WaitForCommand: ");
                //    alert(xhr.responseText + '|\n' + status + '|\n' + error);
                //}
    });

    Commands[0].push(xhr1);
}
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

    Commands[1].push(xhr2);
}
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
                    //SS(result);
                    DeleteCommandFromArray(2);

                    UpdateListOfUsersDiv($("#Receiver").val());
                    UpdateListOfChatRoomsDiv();
                    WaitForCommandToUpdateIndicatorsOfUnreadMessagesInViews();
                    //setTimeout(WaitForCommandToUpdateChat, 200, result);
                },
                //error: function (xhr, status, error) {
                //    alert("ошибка WaitForCommandToUpdateIndicatorsOfUnreadMessagesInViews: ");
                //    alert(xhr.responseText + '|\n' + status + '|\n' + error);
                //}
    });

    Commands[2].push(xhr3);
}

function SS(result) {
    //alert(result);
    var objChat = document.getElementById("ListOfUsers");
    objChat.innerHTML = objChat.innerHTML + result + ", ";
}
function Fail() {
    alert("ошибка: ");
}


function UpdateChatDiv(receiver) {
    var objChat = document.getElementById("Chat");
    $("#Chat").load("/Home/ChatRoom?Receiver=" + receiver);
    //$("#Chat").load("@Url.Action("ChatRoom", "Home")?Receiver=" + receiver);
    setTimeout(scrollToDown, 200);

};
function scrollToDown() {
    var objDiv = document.getElementById("Chat");
    var scrollHeight = Math.max(
      objDiv.scrollHeight, objDiv.offsetHeight, objDiv.clientHeight
    );
    objDiv.scrollTop = objDiv.scrollHeight;
}

function UpdateUserActivity(receiver) {
    $("#InfoAboutActiveUsers").load("/Home/UserActivity?Receiver=" + receiver);
    WaitForCommandToUpdateUserActivityInViews();
};


document.getElementById('btnSend').onclick = function () {

    //var utc = new Date().toJSON().slice(0, 10);
    var testData =
        {
            'Sender': $("#Sender").val(),
            'Receiver': $("#Receiver").val(),
            /*'Date': new Date(), */
            'Text': $("#Text").val()
        };

    $.ajax({
        type: "POST",
        url: "/Home/SaveNewMessageInDatabase",
        data: JSON.stringify(testData),
        contentType: "application/json; charset=utf-8",
        //dataType: "json",
        //success: UpdateChatDiv,
        error: function (xhr, status, error) {
            alert(xhr.responseText + '|\n' + status + '|\n' + error);
        }
    });

    document.getElementById("Text").value = "";
};
document.getElementById('Text').onkeypress = function () {

    //var utc = new Date().toJSON().slice(0, 10);
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
        //dataType: "json",
        //success: UpdateChatDiv,
        error: function (xhr, status, error) {
            alert(xhr.responseText + '|\n' + status + '|\n' + error);
        }
    });
};

function successFunc() {
    alert("Успех!");
}

function errorFunc() {
    alert("ошибка");
}


/*
function replaceTextWithImg() {
    var objMsgTxtClass = document.getElementsByClassName("MsgDataTextClass");
    var n;
    for (n = 0; n < objMsgTxtClass.length; n++) {
        replaceWithImg(objMsgTxtClass[n]);
    }
    //alert("Успех2!");
}
function replaceWithImg(objMsgTxt) {
    var txt = [];
    var img = [];
    txt[0] = '[acute]';
    img[0] = '<img src="/Content/Emoticons/acute.gif" />';
    txt[1] = '[aggressive]';
    img[1] = '<img src="/Content/Emoticons/aggressive.gif" />';
    txt[2] = '[air_kiss]';
    img[2] = '<img src="/Content/Emoticons/air_kiss.gif" />';
    txt[3] = '[angel]';
    img[3] = '<img src="/Content/Emoticons/angel.gif" />';
    txt[4] = '[bad]';
    img[4] = '<img src="/Content/Emoticons/bad.gif" />';
    txt[5] = '[bb]';
    img[5] = '<img src="/Content/Emoticons/bb.gif" />';
    txt[6] = '[beach]';
    img[6] = '<img src="/Content/Emoticons/beach.gif" />';
    txt[7] = '[beee]';
    img[7] = '<img src="/Content/Emoticons/beee.gif" />';
    txt[8] = '[big_boss]';
    img[8] = '<img src="/Content/Emoticons/big_boss.gif" />';
    txt[9] = '[blum]';
    img[9] = '<img src="/Content/Emoticons/blum.gif" />';
    txt[10] = '[blush]';
    img[10] = '<img src="/Content/Emoticons/blush.gif" />';
    txt[11] = '[boast]';
    img[11] = '<img src="/Content/Emoticons/boast.gif" />';
    txt[12] = '[bomb]';
    img[12] = '<img src="/Content/Emoticons/bomb.gif" />';
    txt[13] = '[boredom]';
    img[13] = '<img src="/Content/Emoticons/boredom.gif" />';
    txt[14] = '[bye]';
    img[14] = '<img src="/Content/Emoticons/bye.gif" />';
    txt[15] = '[clapping]';
    img[15] = '<img src="/Content/Emoticons/clapping.gif" />';
    txt[16] = '[cray]';
    img[16] = '<img src="/Content/Emoticons/cray.gif" />';
    txt[17] = '[crazy]';
    img[17] = '<img src="/Content/Emoticons/crazy.gif" />';
    txt[18] = '[curtsey]';
    img[18] = '<img src="/Content/Emoticons/curtsey.gif" />';
    txt[19] = '[dance]';
    img[19] = '<img src="/Content/Emoticons/dance.gif" />';
    txt[20] = '[dash]';
    img[20] = '<img src="/Content/Emoticons/dash.gif" />';
    txt[21] = '[declare]';
    img[21] = '<img src="/Content/Emoticons/declare.gif" />';
    txt[22] = '[diablo]';
    img[22] = '<img src="/Content/Emoticons/diablo.gif" />';
    txt[23] = '[dirol]';
    img[23] = '<img src="/Content/Emoticons/dirol.gif" />';
    txt[24] = '[don-t_mention]';
    img[24] = '<img src="/Content/Emoticons/don-t_mention.gif" />';
    txt[25] = '[download]';
    img[25] = '<img src="/Content/Emoticons/download.gif" />';
    txt[26] = '[drinks]';
    img[26] = '<img src="/Content/Emoticons/drinks.gif" />';
    txt[27] = '[english_en]';
    img[27] = '<img src="/Content/Emoticons/english_en.gif" />';
    txt[28] = '[first_move]';
    img[28] = '<img src="/Content/Emoticons/first_move.gif" />';
    txt[29] = '[flirt]';
    img[29] = '<img src="/Content/Emoticons/flirt.gif" />';
    txt[30] = '[focus]';
    img[30] = '<img src="/Content/Emoticons/focus.gif" />';
    txt[31] = '[fool]';
    img[31] = '<img src="/Content/Emoticons/fool.gif" />';
    txt[32] = '[friends]';
    img[32] = '<img src="/Content/Emoticons/friends.gif" />';
    txt[33] = '[gamer2]';
    img[33] = '<img src="/Content/Emoticons/gamer2.gif" />';
    txt[34] = '[gamer4]';
    img[34] = '<img src="/Content/Emoticons/gamer4.gif" />';
    txt[35] = '[girl_blum]';
    img[35] = '<img src="/Content/Emoticons/girl_blum.gif" />';
    txt[36] = '[girl_cray]';
    img[36] = '<img src="/Content/Emoticons/girl_cray.gif" />';
    txt[37] = '[girl_crazy]';
    img[37] = '<img src="/Content/Emoticons/girl_crazy.gif" />';
    txt[38] = '[girl_dance]';
    img[38] = '<img src="/Content/Emoticons/girl_dance.gif" />';
    txt[39] = '[girl_devil]';
    img[39] = '<img src="/Content/Emoticons/girl_devil.gif" />';
    txt[40] = '[girl_drink]';
    img[40] = '<img src="/Content/Emoticons/girl_drink.gif" />';
    txt[41] = '[girl_drink1]';
    img[41] = '<img src="/Content/Emoticons/girl_drink1.gif" />';
    txt[42] = '[girl_haha]';
    img[42] = '<img src="/Content/Emoticons/girl_haha.gif" />';
    txt[43] = '[girl_hide]';
    img[43] = '<img src="/Content/Emoticons/girl_hide.gif" />';
    txt[44] = '[girl_hospital]';
    img[44] = '<img src="/Content/Emoticons/girl_hospital.gif" />';
    txt[45] = '[girl_impossible]';
    img[45] = '<img src="/Content/Emoticons/girl_impossible.gif" />';
    txt[46] = '[girl_in_love]';
    img[46] = '<img src="/Content/Emoticons/girl_in_love.gif" />';
    txt[47] = '[girl_mad]';
    img[47] = '<img src="/Content/Emoticons/girl_mad.gif" />';
    txt[48] = '[girl_pinkglassesf]';
    img[48] = '<img src="/Content/Emoticons/girl_pinkglassesf.gif" />';
    txt[49] = '[girl_sad]';
    img[49] = '<img src="/Content/Emoticons/girl_sad.gif" />';
    txt[50] = '[girl_sigh]';
    img[50] = '<img src="/Content/Emoticons/girl_sigh.gif" />';
    txt[51] = '[girl_smile]';
    img[51] = '<img src="/Content/Emoticons/girl_smile.gif" />';
    txt[52] = '[girl_wacko]';
    img[52] = '<img src="/Content/Emoticons/girl_wacko.gif" />';
    txt[53] = '[girl_wink]';
    img[53] = '<img src="/Content/Emoticons/girl_wink.gif" />';
    txt[54] = '[girl_witch]';
    img[54] = '<img src="/Content/Emoticons/girl_witch.gif" />';
    txt[55] = '[give_heart]';
    img[55] = '<img src="/Content/Emoticons/give_heart.gif" />';
    txt[56] = '[give_rose]';
    img[56] = '<img src="/Content/Emoticons/give_rose.gif" />';
    txt[57] = '[good]';
    img[57] = '<img src="/Content/Emoticons/good.gif" />';
    txt[58] = '[heart]';
    img[58] = '<img src="/Content/Emoticons/heart.gif" />';
    txt[59] = '[heat]';
    img[59] = '<img src="/Content/Emoticons/heat.gif" />';
    txt[60] = '[help]';
    img[60] = '<img src="/Content/Emoticons/help.gif" />';
    txt[61] = '[hi]';
    img[61] = '<img src="/Content/Emoticons/hi.gif" />';
    txt[62] = '[hunter]';
    img[62] = '<img src="/Content/Emoticons/hunter.gif" />';
    txt[63] = '[hysteric]';
    img[63] = '<img src="/Content/Emoticons/hysteric.gif" />';
    txt[64] = '[i-m_so_happy]';
    img[64] = '<img src="/Content/Emoticons/i-m_so_happy.gif" />';
    txt[65] = '[ireful]';
    img[65] = '<img src="/Content/Emoticons/ireful.gif" />';
    txt[66] = '[king]';
    img[66] = '<img src="/Content/Emoticons/king.gif" />';
    txt[67] = '[kiss]';
    img[67] = '<img src="/Content/Emoticons/kiss.gif" />';
    txt[68] = '[laugh]';
    img[68] = '<img src="/Content/Emoticons/laugh.gif" />';
    txt[69] = '[lazy]';
    img[69] = '<img src="/Content/Emoticons/lazy.gif" />';
    txt[70] = '[lol]';
    img[70] = '<img src="/Content/Emoticons/lol.gif" />';
    txt[71] = '[mail]';
    img[71] = '<img src="/Content/Emoticons/mail.gif" />';
    txt[72] = '[mamba]';
    img[72] = '<img src="/Content/Emoticons/mamba.gif" />';
    txt[73] = '[man_in_love]';
    img[73] = '<img src="/Content/Emoticons/man_in_love.gif" />';
    txt[74] = '[mda]';
    img[74] = '<img src="/Content/Emoticons/mda.gif" />';
    txt[75] = '[mega_shok]';
    img[75] = '<img src="/Content/Emoticons/mega_shok.gif" />';
    txt[76] = '[moil]';
    img[76] = '<img src="/Content/Emoticons/moil.gif" />';
    txt[77] = '[mosking]';
    img[77] = '<img src="/Content/Emoticons/mosking.gif" />';
    txt[78] = '[music]';
    img[78] = '<img src="/Content/Emoticons/music.gif" />';
    txt[79] = '[nea]';
    img[79] = '<img src="/Content/Emoticons/nea.gif" />';
    txt[80] = '[negative]';
    img[80] = '<img src="/Content/Emoticons/negative.gif" />';
    txt[81] = '[new_russian]';
    img[81] = '<img src="/Content/Emoticons/new_russian.gif" />';
    txt[82] = '[ok]';
    img[82] = '<img src="/Content/Emoticons/ok.gif" />';
    txt[83] = '[on_the_quiet]';
    img[83] = '<img src="/Content/Emoticons/on_the_quiet.gif" />';
    txt[84] = '[padonak]';
    img[84] = '<img src="/Content/Emoticons/padonak.gif" />';
    txt[85] = '[paint]';
    img[85] = '<img src="/Content/Emoticons/paint.gif" />';
    txt[86] = '[pardon]';
    img[86] = '<img src="/Content/Emoticons/pardon.gif" />';
    txt[87] = '[parting]';
    img[87] = '<img src="/Content/Emoticons/parting.gif" />';
    txt[88] = '[party]';
    img[88] = '<img src="/Content/Emoticons/party.gif" />';
    txt[89] = '[pilot]';
    img[89] = '<img src="/Content/Emoticons/pilot.gif" />';
    txt[90] = '[pleasantry]';
    img[90] = '<img src="/Content/Emoticons/pleasantry.gif" />';
    txt[91] = '[popcorm]';
    img[91] = '<img src="/Content/Emoticons/popcorm.gif" />';
    txt[92] = '[prankster]';
    img[92] = '<img src="/Content/Emoticons/prankster.gif" />';
    txt[93] = '[preved]';
    img[93] = '<img src="/Content/Emoticons/preved.gif" />';
    txt[94] = '[punish]';
    img[94] = '<img src="/Content/Emoticons/punish.gif" />';
    txt[95] = '[rofl]';
    img[95] = '<img src="/Content/Emoticons/rofl.gif" />';
    txt[96] = '[rtfm]';
    img[96] = '<img src="/Content/Emoticons/rtfm.gif" />';
    txt[97] = '[russian_ru]';
    img[97] = '<img src="/Content/Emoticons/russian_ru.gif" />';
    txt[98] = '[sad]';
    img[98] = '<img src="/Content/Emoticons/sad.gif" />';
    txt[99] = '[sarcastic]';
    img[99] = '<img src="/Content/Emoticons/sarcastic.gif" />';
    txt[100] = '[sarcastic_blum]';
    img[100] = '<img src="/Content/Emoticons/sarcastic_blum.gif" />';
    txt[101] = '[sarcastic_hand]';
    img[101] = '<img src="/Content/Emoticons/sarcastic_hand.gif" />';
    txt[102] = '[scare]';
    img[102] = '<img src="/Content/Emoticons/scare.gif" />';
    txt[103] = '[scaut]';
    img[103] = '<img src="/Content/Emoticons/scaut.gif" />';
    txt[104] = '[scratch_one-s_head]';
    img[104] = '<img src="/Content/Emoticons/scratch_one-s_head.gif" />';
    txt[105] = '[search]';
    img[105] = '<img src="/Content/Emoticons/search.gif" />';
    txt[106] = '[secret]';
    img[106] = '<img src="/Content/Emoticons/secret.gif" />';
    txt[107] = '[shok]';
    img[107] = '<img src="/Content/Emoticons/shok.gif" />';
    txt[108] = '[shout]';
    img[108] = '<img src="/Content/Emoticons/shout.gif" />';
    txt[109] = '[smile]';
    img[109] = '<img src="/Content/Emoticons/smile.gif" />';
    txt[110] = '[smoke]';
    img[110] = '<img src="/Content/Emoticons/smoke.gif" />';
    txt[111] = '[soldier]';
    img[111] = '<img src="/Content/Emoticons/soldier.gif" />';
    txt[112] = '[soldier_girl]';
    img[112] = '<img src="/Content/Emoticons/soldier_girl.gif" />';
    txt[113] = '[sorry]';
    img[113] = '<img src="/Content/Emoticons/sorry.gif" />';
    txt[114] = '[spiteful]';
    img[114] = '<img src="/Content/Emoticons/spiteful.gif" />';
    txt[115] = '[spruce_up]';
    img[115] = '<img src="/Content/Emoticons/spruce_up.gif" />';
    txt[116] = '[superstition]';
    img[116] = '<img src="/Content/Emoticons/superstition.gif" />';
    txt[117] = '[swoon]';
    img[117] = '<img src="/Content/Emoticons/swoon.gif" />';
    txt[118] = '[tease]';
    img[118] = '<img src="/Content/Emoticons/tease.gif" />';
    txt[119] = '[tender]';
    img[119] = '<img src="/Content/Emoticons/tender.gif" />';
    txt[120] = '[thank_you]';
    img[120] = '<img src="/Content/Emoticons/thank_you.gif" />';
    txt[121] = '[this]';
    img[121] = '<img src="/Content/Emoticons/this.gif" />';
    txt[122] = '[to_become_senile]';
    img[122] = '<img src="/Content/Emoticons/to_become_senile.gif" />';
    txt[123] = '[to_take_umbrage]';
    img[123] = '<img src="/Content/Emoticons/to_take_umbrage.gif" />';
    txt[124] = '[training]';
    img[124] = '<img src="/Content/Emoticons/training.gif" />';
    txt[125] = '[treaten]';
    img[125] = '<img src="/Content/Emoticons/treaten.gif" />';
    txt[126] = '[umnik]';
    img[126] = '<img src="/Content/Emoticons/umnik.gif" />';
    txt[127] = '[unknw]';
    img[127] = '<img src="/Content/Emoticons/unknw.gif" />';
    txt[128] = '[vampire]';
    img[128] = '<img src="/Content/Emoticons/vampire.gif" />';
    txt[129] = '[vava]';
    img[129] = '<img src="/Content/Emoticons/vava.gif" />';
    txt[130] = '[victory]';
    img[130] = '<img src="/Content/Emoticons/victory.gif" />';
    txt[131] = '[wacko]';
    img[131] = '<img src="/Content/Emoticons/wacko.gif" />';
    txt[132] = '[whistle]';
    img[132] = '<img src="/Content/Emoticons/whistle.gif" />';
    txt[133] = '[wink]';
    img[133] = '<img src="/Content/Emoticons/wink.gif" />';
    txt[134] = '[wizard]';
    img[134] = '<img src="/Content/Emoticons/wizard.gif" />';
    txt[135] = '[yahoo]';
    img[135] = '<img src="/Content/Emoticons/yahoo.gif" />';
    txt[136] = '[yes]';
    img[136] = '<img src="/Content/Emoticons/yes.gif" />';
    txt[137] = '[yu]';
    img[137] = '<img src="/Content/Emoticons/yu.gif" />';


    var innTxt = objMsgTxt.innerHTML;
    for (var v = 0; v < txt.length; v++) {
        if (innTxt.includes(txt[v])) {
            innTxt = innTxt.split(txt[v]).join(img[v]);
        }
    }
    objMsgTxt.innerHTML = innTxt;
}
*/

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

/*
function ConvertMessageIdToQuoteText() {
    var objMsgTxtClass = document.getElementsByClassName("MsgDataTextClass");
    var n;
    for (n = 0; n < objMsgTxtClass.length; n++) {
        replaceWithQuote(objMsgTxtClass[n]);
    }
};
function replaceWithQuote(MsgToProcess) {
    var startStr = '[quote]';
    var endStr = '[/quote]';
    var innTxt = MsgToProcess.innerHTML;
    //var MsgToProcessTxt = MsgToProcess.innerHTML;
    var startStrPos = innTxt.indexOf(startStr);
    var endStrPos = innTxt.indexOf(endStr);
    
    
    while (startStrPos != -1) {
        MsgId = innTxt.slice(startStrPos + 7, endStrPos);
        var MsgText = GetMsgText(MsgId);

        innTxt = innTxt.split(startStr + MsgId + endStr).join('Працює!' + MsgText);
        MsgToProcess.innerHTML = innTxt;

        startStrPos = innTxt.indexOf(startStr, startStrPos + 1);
        endStrPos = innTxt.indexOf(endStr, endStrPos + 1);
    }
};
function GetMsgText(MsgId) {
    var result = "";
    var testData =
    {
        'MsgId': MsgId,
    };
    $.ajax({
        type: "POST",
        url: "/Home/GetMessageText",
        async: false,
        data: JSON.stringify(testData),
        contentType: "application/json; charset=utf-8",
        //dataType: "json",
        success: function (response) {
            result = response; 
        },
        error: function (xhr, status, error) {
            alert(xhr.responseText + '|\n' + status + '|\n' + error);
        }
    });
    return result;
}
*/

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
        //success: function () {
        //},

        //error: function (xhr, status, error) {
        //    alert("ошибка ClientInitialization: ");
        //    alert(xhr.responseText + '|\n' + status + '|\n' + error);
        //}
    });

    ClearCommands();
}

function UpdateListOfUsersDiv(receiver) {
    //var objListOfUsers = document.getElementById("ListOfUsers");
    //objListOfUsers.load("/Home/ListOfUsers");
    $("#ListOfUsers").load("/Home/ListOfUsers?Receiver=" + receiver);
    //alert("updated:" + result);
};
function UpdateListOfChatRoomsDiv() {
    //var objListOfChatRooms = document.getElementById("ListOfChatRooms");
    //objListOfChatRooms.load("/Home/ListOfChatRooms");
    $("#ListOfChatRooms").load("/Home/ListOfChatRooms");
};