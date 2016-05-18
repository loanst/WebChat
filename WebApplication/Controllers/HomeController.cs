using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using WebApplication3.Models;
using System.Threading;
using System.Threading.Tasks;
using System.Data.Entity;
using System.Drawing;
using System.Collections.ObjectModel;
using System.Web.Security.AntiXss;
using System.Web;

namespace WebApplication3.Controllers
{
    [Authorize]
    public class HomeController : Controller
    {
        ChatContext db = new ChatContext();
        protected override void Dispose(bool disposing)
        {
            db.Dispose();
            base.Dispose(disposing);
        }

        //Контейнери для трігерів, за допомогою яких відбувається оновлення вікон чатів після відправки юзером повідомлення.
        static Dictionary<string, AutoResetEvent> TriggersForGlobalChatRoomToUpdateChatRoomInViews = new Dictionary<string, AutoResetEvent>();
        static List<Dictionary<string, AutoResetEvent>> ContainerForTriggersForDirectMessagesToUpdateChatRoomInViews = new List<Dictionary<string, AutoResetEvent>>();
        static Dictionary<string, Dictionary<string, AutoResetEvent>> ContainerForTriggersForConferencesToUpdateChatRoomInViews = new Dictionary<string, Dictionary<string, AutoResetEvent>>();

        //Контейнери для трігерів, за допомогою яких відбувається оновлення індикатора активності (якщо юзер натискає на клавіші).
        static Dictionary<string, AutoResetEvent> TriggersForGlobalChatRoomToUpdateUserActivityInViews = new Dictionary<string, AutoResetEvent>();
        static List<Dictionary<string, AutoResetEvent>> ContainerForTriggersForDirectMessagesToUpdateUserActivityInViews = new List<Dictionary<string, AutoResetEvent>>();
        static Dictionary<string, Dictionary<string, AutoResetEvent>> ContainerForTriggersForConferencesToUpdateUserActivityInViews = new Dictionary<string, Dictionary<string, AutoResetEvent>>();

        //допоміжні змінні для відображення активних користувачів
        static List<string> ListOfActiveUsersFromGeneralChat = new List<string>();
        string InfoAboutActiveUsersFromGeneralChat;
        static List<Dictionary<string, string>> NamesStoreageOfActiveUsersForEachDirectDialog = new List<Dictionary<string, string>>();
        string InfoAboutActiveUsersFromDirectChat;
        static Dictionary<string, Dictionary<string, string>> NamesStoreageOfActiveUsersForEachConference = new Dictionary<string, Dictionary<string, string>>();
        string InfoAboutActiveUsersFromConference;

        //Контейнери для трігерів, які обновляють список зареєстрованих юзерів та список чат кімнат, якщо є непрочитані повідомлення.
        static Dictionary<string, AutoResetEvent> TriggersToUpdateIndicatorsOfUnreadMessagesInViews = new Dictionary<string, AutoResetEvent>();
        static Dictionary<string, Dictionary<string, bool>> IsAUnreadMessages = new Dictionary<string, Dictionary<string, bool>>();

        [HttpPost]
        public string ClientRegistration(string Receiver, string Sender)
        {
            //заповнення контейнерів (в залежності від виду чат кімнати чи прямого діалогу) інформацією про нового юзера
            string CurrentUserGuid = GetUserGuidByName(User.Identity.Name);
            if (db.ChatRooms.FirstOrDefault(chr => chr.Title == "GlobalChatRoom").Guid == Receiver)
            {
                //для загальної кімнати - GlobalChatRoom
                if (!TriggersForGlobalChatRoomToUpdateChatRoomInViews.ContainsKey(CurrentUserGuid))
                {
                    TriggersForGlobalChatRoomToUpdateChatRoomInViews.Add(CurrentUserGuid, new AutoResetEvent(false));
                    TriggersForGlobalChatRoomToUpdateUserActivityInViews.Add(CurrentUserGuid, new AutoResetEvent(false));

                    db.UserProfiles.FirstOrDefault(u => u.UserName == User.Identity.Name).IsOnline = true;
                    db.SaveChanges();

                    //обновлення роздіу з списком юзерів, для усіх користувачів (які онлайн), щоб вони побачили, що новий користувач - онлайн
                    UpdateIndicatorsOfUnreadMessages();
                }
            }
            else if (db.UserProfiles.FirstOrDefault(u => u.Guid == Receiver) != null)
            {
                //для прямої переписки
                if (!ContainerForTriggersForDirectMessagesToUpdateChatRoomInViews.Exists(item => (item.ContainsKey(Receiver) && item.ContainsKey(Sender))))
                {
                    Dictionary<string, AutoResetEvent> TriggersForDirectMessagesToUpdateChatRoomInViews = new Dictionary<string, AutoResetEvent>();
                    TriggersForDirectMessagesToUpdateChatRoomInViews.Add(Receiver, null);
                    TriggersForDirectMessagesToUpdateChatRoomInViews.Add(Sender, new AutoResetEvent(false));
                    ContainerForTriggersForDirectMessagesToUpdateChatRoomInViews.Add(TriggersForDirectMessagesToUpdateChatRoomInViews);

                    Dictionary<string, AutoResetEvent> TriggersForDirectMessagesToUpdateUserActivityInViews = new Dictionary<string, AutoResetEvent>();
                    TriggersForDirectMessagesToUpdateUserActivityInViews.Add(Receiver, null);
                    TriggersForDirectMessagesToUpdateUserActivityInViews.Add(Sender, new AutoResetEvent(false));
                    ContainerForTriggersForDirectMessagesToUpdateUserActivityInViews.Add(TriggersForDirectMessagesToUpdateUserActivityInViews);
                }
                if (ContainerForTriggersForDirectMessagesToUpdateChatRoomInViews.FirstOrDefault(item => (item.ContainsKey(Receiver) && item.ContainsKey(Sender)))[Sender] == null)
                {
                    ContainerForTriggersForDirectMessagesToUpdateChatRoomInViews.FirstOrDefault(item => (item.ContainsKey(Receiver) && item.ContainsKey(Sender)))[Sender] = new AutoResetEvent(false);
                    ContainerForTriggersForDirectMessagesToUpdateUserActivityInViews.FirstOrDefault(item => (item.ContainsKey(Receiver) && item.ContainsKey(Sender)))[Sender] = new AutoResetEvent(false);
                }
            }
            else //if (db.ChatRooms.FirstOrDefault(chr => chr.Guid == msg.Receiver) != null)
            {
                if (!ContainerForTriggersForConferencesToUpdateChatRoomInViews.ContainsKey(Receiver))
                {
                    ContainerForTriggersForConferencesToUpdateChatRoomInViews.Add(Receiver, new Dictionary<string, AutoResetEvent>());
                    ContainerForTriggersForConferencesToUpdateUserActivityInViews.Add(Receiver, new Dictionary<string, AutoResetEvent>());
                }
                if (ContainerForTriggersForConferencesToUpdateChatRoomInViews.ContainsKey(Receiver) && !ContainerForTriggersForConferencesToUpdateChatRoomInViews[Receiver].ContainsKey(Sender))
                {
                    ContainerForTriggersForConferencesToUpdateChatRoomInViews[Receiver].Add(Sender, new AutoResetEvent(false));
                    ContainerForTriggersForConferencesToUpdateUserActivityInViews[Receiver].Add(Sender, new AutoResetEvent(false));
                }

            }

            //коли сторінка згенерована, видалити інформацію про непрочитані повідомлення (якщо вона є).
            ClearUserInformationFromContainerWithInfoAboutUnreadMessagesAfterUserVisit(Receiver, Sender);

            return CurrentUserGuid;
        }

        [HttpPost]
        public void SaveNewMessageInDatabase(Message msg)
        {
            if (msg.Text != null)
            {
                msg.SenderName = GetUserNameByGuid(msg.Sender);
                msg.Text = AntiXssEncoder.HtmlEncode(msg.Text, false);
                msg.TextColor = db.UserProfiles.FirstOrDefault(u => u.Guid == msg.Sender).LoginColor;
                msg.Date = DateTime.UtcNow;
                db.Messages.Add(msg);
                db.SaveChanges();
            }

            UpdateChatPart(msg.Receiver, msg.Sender);
            UpdateIndicatorsOfUnreadMessages();
        }
        [HttpPost]
        public void SaveEditedMessageInDatabase(string MsgText, int MsgId)
        {
            if (MsgText != null)
            {
                Message msg = db.Messages.Find(MsgId);
                msg.Text = AntiXssEncoder.HtmlEncode(MsgText, false);
                db.SaveChanges();
                //оновити вікно відповідного чату, щоб відобразити іншим присутнім користувачам нове повідомлення
                if (msg.Receiver == GetChatRoomGuidByTitle("GlobalChatRoom"))
                {
                    UpdateChatForAllClients();
                }
                else if (ContainerForTriggersForDirectMessagesToUpdateChatRoomInViews.Exists(item => (item.ContainsKey(msg.Receiver) && item.ContainsKey(msg.Sender))))
                {
                    UpdateChatForAllClientsDirect(msg.Receiver, msg.Sender);
                }
                else
                {
                    UpdateChatForAllClientsOfSpecificChatRoom(msg.Receiver, msg.Sender);
                }
            }
        }
        [HttpGet]
        public ActionResult EditMessageText(int MsgId)
        {
            Message msg = db.Messages.Find(MsgId);
            if (msg.SenderName == User.Identity.Name)
            {
                ViewBag.Id = msg.Id;
                ViewBag.MsgText = msg.Text;
                ViewBag.DefaultChatRoom = db.ChatRooms.FirstOrDefault(cr => cr.Title == "GlobalChatRoom");
                ViewBag.CurrentUser = db.UserProfiles.FirstOrDefault(u => u.UserName == User.Identity.Name);
            }

            return PartialView();
        }
        [HttpGet]
        public void DeleteMessageFromDatabase(int MsgId)
        {
            Message msg = db.Messages.Find(MsgId);

            //перевірка відповідності логінів юзера який видаляє повідомлення та логіна вказаного в бд для цього повідомлення.
            if (msg.SenderName == User.Identity.Name)
            {
                db.Messages.Remove(msg);
                db.SaveChanges();

                //оновити вікно відповідного чату, щоб відобразити іншим присутнім користувачам нове повідомлення
                if (msg.Receiver == GetChatRoomGuidByTitle("GlobalChatRoom"))
                {
                    UpdateChatForAllClients();
                }
                else if (ContainerForTriggersForDirectMessagesToUpdateChatRoomInViews.Exists(item => (item.ContainsKey(msg.Receiver) && item.ContainsKey(msg.Sender))))
                {
                    UpdateChatForAllClientsDirect(msg.Receiver, msg.Sender);
                }
                else
                {
                    UpdateChatForAllClientsOfSpecificChatRoom(msg.Receiver, msg.Sender);
                }
            }


            
        }

        private void EnterInfoAboutUnreadMessages(string CurrentUserGuid)
        {
            //для поточного юзера перевірити бд на те, чи є для нього непрочитані повідомлення 
            //в чат кімнатах та в прямій переписці. Якщо є - внести інформацію про них в словник.

            IEnumerable<ChatRoom> chatrooms = GetChatRoomsOfUser(CurrentUserGuid);
            foreach (ChatRoom cr in chatrooms)
            {
                ActivityDates crad = GetActivityDates(cr.Guid, CurrentUserGuid);
                Message LastMessageInChatRoom = GetMessagesOfChatRoom(cr.Guid).LastOrDefault();
                if((crad != null) && (LastMessageInChatRoom != null))
                {
                    if ((LastMessageInChatRoom.Sender != CurrentUserGuid) && (crad.LastEnterChatRoomDate < crad.LastExitChatRoomDate) && (LastMessageInChatRoom.Date > crad.LastExitChatRoomDate) )
                    {
                        if (IsAUnreadMessages.ContainsKey(cr.Guid) && !IsAUnreadMessages[cr.Guid].ContainsKey(CurrentUserGuid))
                        {
                            IsAUnreadMessages[cr.Guid].Add(CurrentUserGuid, true);
                        }
                        else if (IsAUnreadMessages.ContainsKey(cr.Guid) && IsAUnreadMessages[cr.Guid].ContainsKey(CurrentUserGuid))
                        {
                        }
                        else
                        {
                            IsAUnreadMessages.Add(cr.Guid, new Dictionary<string, bool> { { CurrentUserGuid, true } });
                        }
                    }
                }
            }

            //заповнити статичний клас даними про непрочитані повідомлення з прямої переписки.
            foreach (UserProfile user in db.UserProfiles)
            {
                ActivityDates uad = GetActivityDates(user.Guid, CurrentUserGuid);
                Message LastMessageInDirectDialog = GetLastMessage(user.Guid);
                if ((uad != null) && (LastMessageInDirectDialog != null))
                {
                    if ((LastMessageInDirectDialog.Sender != CurrentUserGuid) && (uad.LastEnterChatRoomDate < uad.LastExitChatRoomDate) && (LastMessageInDirectDialog.Date > uad.LastExitChatRoomDate))
                    {
                        if (IsAUnreadMessages.ContainsKey(user.Guid) && !IsAUnreadMessages[user.Guid].ContainsKey(CurrentUserGuid))
                        {
                            IsAUnreadMessages[user.Guid].Add(CurrentUserGuid, true);
                        }
                        else if (IsAUnreadMessages.ContainsKey(user.Guid) && IsAUnreadMessages[user.Guid].ContainsKey(CurrentUserGuid))
                        {
                        }
                        else
                        {
                            IsAUnreadMessages.Add(user.Guid, new Dictionary<string, bool> { { CurrentUserGuid, true } });
                        }
                    }
                }
            }

            if (!TriggersToUpdateIndicatorsOfUnreadMessagesInViews.ContainsKey(CurrentUserGuid))
            {
                TriggersToUpdateIndicatorsOfUnreadMessagesInViews.Add(CurrentUserGuid, new AutoResetEvent(false));
            }
        }
        private void ClearUserInformationFromContainerWithInfoAboutUnreadMessagesAfterUserVisit(string ChatRoomGuid, string VisitorGuid)
        {
            if((IsAUnreadMessages.ContainsKey(ChatRoomGuid)) && (IsAUnreadMessages[ChatRoomGuid].ContainsKey(VisitorGuid)))
            {
                IsAUnreadMessages[ChatRoomGuid].Remove(VisitorGuid);
            }

            if ((IsAUnreadMessages.ContainsKey(ChatRoomGuid)) && (IsAUnreadMessages[ChatRoomGuid].Count == 0))
            {
                IsAUnreadMessages.Remove(ChatRoomGuid);
            }
        }

        internal void PutLastEnterChatRoomOrDialogDateOfUser(string ChatRoomOrAdressee, string Sender)
        {
            if (db.ActivityDates.FirstOrDefault(i => i.Receiver == ChatRoomOrAdressee && i.Sender == Sender) == null)
            {
                ActivityDates ActivityDate = new ActivityDates() { Receiver = ChatRoomOrAdressee, Sender = Sender, LastExitChatRoomDate = DateTime.UtcNow, LastEnterChatRoomDate = DateTime.UtcNow };
                db.ActivityDates.Add(ActivityDate);
            }
            else
            {
                db.ActivityDates.FirstOrDefault(i => i.Receiver == ChatRoomOrAdressee && i.Sender == Sender).LastEnterChatRoomDate = DateTime.UtcNow;
            }
            db.SaveChanges();
        }
        internal void PutLastExitChatRoomOrDialogDateOfUser(string ChatRoomOrAdressee, string Sender)
        {
            if (db.ActivityDates.FirstOrDefault(i => i.Receiver == ChatRoomOrAdressee && i.Sender == Sender) == null)
            {
                ActivityDates ActivityDate = new ActivityDates() { Receiver = ChatRoomOrAdressee, Sender = Sender, LastExitChatRoomDate = DateTime.UtcNow, LastEnterChatRoomDate = DateTime.UtcNow };
                db.ActivityDates.Add(ActivityDate);
            }
            else
            {
                db.ActivityDates.FirstOrDefault(i => i.Receiver == ChatRoomOrAdressee && i.Sender == Sender).LastExitChatRoomDate = DateTime.UtcNow;
            }
            db.SaveChanges();
        }

        //коли юзер змінює чат кімнати чи переходить в пряму переписку
        [HttpPost]
        public void ClientExit(string Receiver, string Sender)
        {
            PutLastExitChatRoomOrDialogDateOfUser(Receiver, Sender);

            //останній запуск трігерів, щоб звільнити ajax запити (поновлення вікна), які очікують на команди.
            UpdateChatPart(Receiver, Sender);
            ProcessKeypressFromUser(Receiver, Sender);
            UpdateIndicatorsOfUnreadMessages(Sender);
        }

        //затримка Ajax запита (для оновлення розділу з перепискою)
        [HttpPost]
        public void WaitForCommand(string Receiver, string Sender)
        {
            if (db.ChatRooms.FirstOrDefault(chr => chr.Title == "GlobalChatRoom").Guid == Receiver)
            {
                TriggersForGlobalChatRoomToUpdateChatRoomInViews[Sender].WaitOne();
            }
            else if (db.UserProfiles.FirstOrDefault(u => u.Guid == Receiver) != null)
            {
                ContainerForTriggersForDirectMessagesToUpdateChatRoomInViews.FirstOrDefault(item => (item.ContainsKey(Receiver) && item.ContainsKey(Sender)))[Sender].WaitOne();
            }
            else //if (db.ChatRooms.FirstOrDefault(chr => chr.Guid == msg.Receiver) != null)
            {
                ContainerForTriggersForConferencesToUpdateChatRoomInViews[Receiver].FirstOrDefault(d => d.Key == Sender).Value.WaitOne();
            }
        }
        //затримка Ajax запита (для оновлення мітки активності користувачів)
        [HttpPost]
        public void WaitForCommandToUpdateUserActivityInViews(string Receiver, string Sender)
        {
            if (db.ChatRooms.FirstOrDefault(chr => chr.Title == "GlobalChatRoom").Guid == Receiver)
            {
                TriggersForGlobalChatRoomToUpdateUserActivityInViews[Sender].WaitOne();
            }
            else if (db.UserProfiles.FirstOrDefault(u => u.Guid == Receiver) != null)
            {
                ContainerForTriggersForDirectMessagesToUpdateUserActivityInViews.FirstOrDefault(item => (item.ContainsKey(Receiver) && item.ContainsKey(Sender)))[Sender].WaitOne();
            }
            else //if (db.ChatRooms.FirstOrDefault(chr => chr.Guid == msg.Receiver) != null)
            {
                ContainerForTriggersForConferencesToUpdateUserActivityInViews[Receiver].FirstOrDefault(d => d.Key == Sender).Value.WaitOne();
            }
        }
        //затримка Ajax запита (для оновлення розділу з списком юзерів та розділу з списком чат кімнат)
        [HttpPost]
        public void WaitForCommandToUpdateIndicatorsOfUnreadMessagesInViews(string Receiver, string Sender)
        {
            TriggersToUpdateIndicatorsOfUnreadMessagesInViews[Sender].WaitOne();
        }

        private void UpdateChatPart(string Receiver, string Sender)
        {
            if (db.ChatRooms.FirstOrDefault(chr => chr.Title == "GlobalChatRoom").Guid == Receiver)
            {
                UpdateChatForAllClients();
            }
            else if (db.UserProfiles.FirstOrDefault(u => u.Guid == Receiver) != null)
            {
                UpdateChatForAllClientsDirect(Receiver, Sender);
            }
            else //if (db.ChatRooms.FirstOrDefault(chr => chr.Guid == msg.Receiver) != null)
            {
                UpdateChatForAllClientsOfSpecificChatRoom(Receiver, Sender);
            }
        }
        private void UpdateChatForAllClients()
        {
            foreach (KeyValuePair<string, AutoResetEvent> kvp in TriggersForGlobalChatRoomToUpdateChatRoomInViews)
            {
                kvp.Value.Set();
            }
        }
        private void UpdateChatForAllClientsDirect(string Receiver, string Sender)
        {
            if (ContainerForTriggersForDirectMessagesToUpdateChatRoomInViews.Exists(item => (item.ContainsKey(Receiver) && item.ContainsKey(Sender))))
            {
                foreach (KeyValuePair<string, AutoResetEvent> kvp in ContainerForTriggersForDirectMessagesToUpdateChatRoomInViews.FirstOrDefault(item => (item.ContainsKey(Receiver) && item.ContainsKey(Sender))))
                {
                    if (kvp.Value != null)
                    {
                        kvp.Value.Set();
                    }
                }
            }
        }
        private void UpdateChatForAllClientsOfSpecificChatRoom(string Receiver, string Sender)
        {
            foreach (KeyValuePair<string, AutoResetEvent> kvp in ContainerForTriggersForConferencesToUpdateChatRoomInViews[Receiver])
            {
                kvp.Value.Set();
            }
        }

        [HttpPost]
        public void ProcessKeypressFromUser(string Receiver, string Sender)
        {
            //якщо юзер натискає кнопку - він стає активним. Інформація про нього заноситься у відповідний 
            //контейнер (в залежності від того, в якому чаті він знаходиться).
            //в кінці запускається метод, який оновлює вікна відповідного чату чи діалогу.

            //для базової чат кімнати - "GlobalChatRoom"
            if (db.ChatRooms.FirstOrDefault(chr => chr.Title == "GlobalChatRoom").Guid == Receiver)
            {
                if (!ListOfActiveUsersFromGeneralChat.Contains(GetUserNameByGuid(Sender)))
                {
                    ListOfActiveUsersFromGeneralChat.Add(GetUserNameByGuid(Sender));
                    UpdateUserActivityForAllClients();
                }

            }
            //для "прямих" діалогів
            else if (db.UserProfiles.FirstOrDefault(u => u.Guid == Receiver) != null)
            {
                if (NamesStoreageOfActiveUsersForEachDirectDialog.FirstOrDefault(item => (item.ContainsKey(Receiver) && item.ContainsKey(Sender))) == null)
                {
                    Dictionary<string, string> ConteinerToStoreActiveUsersInDialog = new Dictionary<string, string>();
                    ConteinerToStoreActiveUsersInDialog.Add(Receiver, "");
                    ConteinerToStoreActiveUsersInDialog.Add(Sender, GetUserNameByGuid(Sender));
                    NamesStoreageOfActiveUsersForEachDirectDialog.Add(ConteinerToStoreActiveUsersInDialog);
                    UpdateUserActivityForAllClientsDirect(Receiver, Sender);
                }
                else
                {
                    if (NamesStoreageOfActiveUsersForEachDirectDialog.FirstOrDefault(item => (item.ContainsKey(Receiver) && item.ContainsKey(Sender))).FirstOrDefault(i => i.Value.Contains(GetUserNameByGuid(Sender))).Value == null)
                    {
                        NamesStoreageOfActiveUsersForEachDirectDialog.FirstOrDefault(item => (item.ContainsKey(Receiver) && item.ContainsKey(Sender)))[Sender] = GetUserNameByGuid(Sender);
                        UpdateUserActivityForAllClientsDirect(Receiver, Sender);
                    }
                }

            }

            //для групової чат кімнати (конференції)
            else //if (db.ChatRooms.FirstOrDefault(chr => chr.Guid == msg.Receiver) != null)
            {
                if (NamesStoreageOfActiveUsersForEachConference.ContainsKey(Receiver) == false)
                {
                    Dictionary<string, string> ConteinerToStoreActiveUsersInConference = new Dictionary<string, string>();
                    ConteinerToStoreActiveUsersInConference.Add(Sender, GetUserNameByGuid(Sender));
                    NamesStoreageOfActiveUsersForEachConference.Add(Receiver, ConteinerToStoreActiveUsersInConference);
                    UpdateUserActivityForAllClientsOfSpecificChatRoom(Receiver, Sender);
                }
                else
                {
                    if (NamesStoreageOfActiveUsersForEachConference[Receiver].FirstOrDefault(i => i.Value.Contains(GetUserNameByGuid(Sender))).Value == null)
                    {
                        NamesStoreageOfActiveUsersForEachConference[Receiver][Sender] = GetUserNameByGuid(Sender);
                        UpdateUserActivityForAllClientsOfSpecificChatRoom(Receiver, Sender);
                    }
                }

            }
        }
        private void UpdateUserActivityForAllClients()
        {
            //оновлення мітки активності, щоб відобразити логін нового активного юзера
            foreach (KeyValuePair<string, AutoResetEvent> kvp in TriggersForGlobalChatRoomToUpdateUserActivityInViews)
            {
                kvp.Value.Set();
            }
            //затримка для відображення списка юзерів в індикаторі активності
            Thread.Sleep(3000);
            ListOfActiveUsersFromGeneralChat.Remove(User.Identity.Name);
            //оновлення мітки активності, без логіна юзера
            foreach (KeyValuePair<string, AutoResetEvent> kvp in TriggersForGlobalChatRoomToUpdateUserActivityInViews)
            {
                kvp.Value.Set();
            }
        }
        private void UpdateUserActivityForAllClientsDirect(string Receiver, string Sender)
        {
            if (ContainerForTriggersForDirectMessagesToUpdateUserActivityInViews.Exists(item => (item.ContainsKey(Receiver) && item.ContainsKey(Sender))))
            {
                //оновлення мітки активності, щоб відобразити логін нового активного юзера
                foreach (KeyValuePair<string, AutoResetEvent> kvp in ContainerForTriggersForDirectMessagesToUpdateUserActivityInViews.FirstOrDefault(item => (item.ContainsKey(Receiver) && item.ContainsKey(Sender))))
                {
                    if (kvp.Value != null)
                    {
                        kvp.Value.Set();
                    }
                }
                //затримка для відображення списка юзерів в індикаторі активності
                Thread.Sleep(3000);
                NamesStoreageOfActiveUsersForEachDirectDialog.FirstOrDefault(item => (item.ContainsKey(Receiver) && item.ContainsKey(Sender)))[Sender] = "";
                //оновлення мітки активності, без логіна юзера
                foreach (KeyValuePair<string, AutoResetEvent> kvp in ContainerForTriggersForDirectMessagesToUpdateUserActivityInViews.FirstOrDefault(item => (item.ContainsKey(Receiver) && item.ContainsKey(Sender))))
                {
                    if (kvp.Value != null)
                    {
                        kvp.Value.Set();
                    }
                }
            }
        }
        private void UpdateUserActivityForAllClientsOfSpecificChatRoom(string Receiver, string Sender)
        {
            //оновлення мітки активності, щоб відобразити логін нового активного юзера
            foreach (KeyValuePair<string, AutoResetEvent> kvp in ContainerForTriggersForConferencesToUpdateUserActivityInViews[Receiver])
            {
                kvp.Value.Set();
            }
            //затримка для відображення списка юзерів в індикаторі активності
            Thread.Sleep(3000);
            NamesStoreageOfActiveUsersForEachConference[Receiver][Sender] = "";
            //оновлення мітки активності, без логіна юзера
            foreach (KeyValuePair<string, AutoResetEvent> kvp in ContainerForTriggersForConferencesToUpdateUserActivityInViews[Receiver])
            {
                kvp.Value.Set();
            }
        }
        [HttpGet]
        public string RegisterActiveUserAndGetAllActiveUsersNames(string Receiver)
        {
            //в текстову змінну вноситься активний користувач та вона відправляється для відображення на сторінці
            if (Receiver == db.ChatRooms.FirstOrDefault(cr => cr.Title == "GlobalChatRoom").Guid)
            {
                InfoAboutActiveUsersFromGeneralChat = "";
                foreach (string str in ListOfActiveUsersFromGeneralChat)
                {
                    InfoAboutActiveUsersFromGeneralChat += str + " ";
                }
                return InfoAboutActiveUsersFromGeneralChat;
            }
            else if (db.UserProfiles.FirstOrDefault(u => u.Guid == Receiver) != null)
            {
                InfoAboutActiveUsersFromDirectChat = "";
                foreach (KeyValuePair<string, string> kvp in NamesStoreageOfActiveUsersForEachDirectDialog.FirstOrDefault(item => (item.ContainsKey(Receiver) && item.ContainsKey(GetUserGuidByName(User.Identity.Name)))))
                {
                    InfoAboutActiveUsersFromDirectChat += kvp.Value + " ";
                }
                return InfoAboutActiveUsersFromDirectChat;
            }
            else
            {
                InfoAboutActiveUsersFromConference = "";
                foreach (KeyValuePair<string, string> kvp in NamesStoreageOfActiveUsersForEachConference[Receiver])
                {
                    InfoAboutActiveUsersFromConference += kvp.Value + " ";
                }
                return InfoAboutActiveUsersFromConference;
            }
        }

        //відображення індикаторів непрочитаних повідомлень, якщо таке повідомлення зявляється (коли юзер не знаходиться в певному чаті)
        internal void UpdateIndicatorsOfUnreadMessages(string Sender = null)
        {
            if (Sender == null)
            {
                foreach (KeyValuePair<string, AutoResetEvent> kvp in TriggersToUpdateIndicatorsOfUnreadMessagesInViews)
                {
                    kvp.Value.Set();
                }
            }
            else
            {
                if (TriggersToUpdateIndicatorsOfUnreadMessagesInViews.ContainsKey(Sender))
                {
                    TriggersToUpdateIndicatorsOfUnreadMessagesInViews[Sender].Set();
                }
            }

        }
        private void UpdateListOfUsersAndListOfChatRoomsForAllOnlineUsers()
        {
            foreach (UserProfile u in db.UserProfiles)
            {
                if (u.IsOnline == true)
                {
                    TriggersToUpdateIndicatorsOfUnreadMessagesInViews[u.Guid].Set();
                }
            }
        }

        private ActivityDates GetActivityDates(string Receiver, string Sender)
        {
            return db.ActivityDates.FirstOrDefault(i => (i.Sender == Sender) && (i.Receiver == Receiver));
        }
        internal string GetUserGuidByName(string Name)
        {
            return db.UserProfiles.FirstOrDefault(r => r.UserName == Name).Guid;
        }
        internal string GetChatRoomGuidByTitle(string Title)
        {
            return db.ChatRooms.FirstOrDefault(cr => cr.Title == Title).Guid;
        }
        private string GetChatRoomTitleByGuid(string Guid)
        {
            return db.ChatRooms.FirstOrDefault(cr => cr.Guid == Guid).Title;
        }
        private string GetUserNameByGuid(string Guid)
        {
            return db.UserProfiles.FirstOrDefault(u => u.Guid == Guid).UserName;
        }
        private IEnumerable<Message> GetMessages()
        {
            string Guid = GetChatRoomGuidByTitle("GlobalChatRoom");
            IEnumerable<Message> messages = from msg in db.Messages
                                            where msg.Receiver == Guid
                                            select msg;
            return messages;
        }
        private IEnumerable<Message> GetMessages(string Receiver)
        {
            string CurentUserGuid = GetUserGuidByName(User.Identity.Name);
            IEnumerable<Message> messages = from msg in db.Messages
                                            where ((msg.Sender == CurentUserGuid) & (msg.Receiver == Receiver) | (msg.Sender == Receiver) & (msg.Receiver == CurentUserGuid)) //User.Identity.Name
                                            select msg;
            return messages;
        }
        private Message GetLastMessage(string Receiver)
        {
            string CurentUserGuid = GetUserGuidByName(User.Identity.Name);
            IEnumerable<Message> messages = from msg in db.Messages
                                            where ((msg.Sender == CurentUserGuid) & (msg.Receiver == Receiver) | (msg.Sender == Receiver) & (msg.Receiver == CurentUserGuid))
                                            select msg;
            return messages.LastOrDefault();
        }
        private string GetMessageText(int MsgId)
        {
            return db.Messages.Find(MsgId).Text;
        }
        private IEnumerable<Message> GetMessagesOfChatRoom(string ChatRoomGuid)
        {
            IEnumerable<Message> messages = from msg in db.Messages
                                            where msg.Receiver == ChatRoomGuid
                                            select msg;
            return messages;
        }
        private IEnumerable<UserProfile> GetUsers()
        {
            return db.UserProfiles;
        }
        private IEnumerable<UserProfile> GetUsers(string Receiver)
        {
            IEnumerable<UserProfile> users = from usr in db.UserProfiles
                                             where usr.UserName == User.Identity.Name
                                             where usr.UserName == Receiver
                                             select usr;
            return users;
        }
        private IEnumerable<UserProfile> GetUsersOfChatRoom(string ChatRoomGuid)
        {
            ChatRoom cr = db.ChatRooms.FirstOrDefault(c => c.Guid == ChatRoomGuid);
            List<UserProfile> users = new List<UserProfile>();
            foreach (UserProfile u in cr.Users)
            {
                users.Add(u);
            }
            return users;
        }
        private IEnumerable<ChatRoom> GetChatRoomsOfUser(string UserGuid)
        {
            return db.UserProfiles.FirstOrDefault(u => u.Guid == UserGuid).ChatRooms;
        }

        [AllowAnonymous]
        public ActionResult Index()
        {
            return View();
        }
        public ActionResult Main(string Receiver)
        {
            if (Receiver == null)
            {
                Receiver = GetChatRoomGuidByTitle("GlobalChatRoom");
            }
            PutLastEnterChatRoomOrDialogDateOfUser(Receiver, GetUserGuidByName(User.Identity.Name));
            EnterInfoAboutUnreadMessages(GetUserGuidByName(User.Identity.Name));

            if (Receiver == GetChatRoomGuidByTitle("GlobalChatRoom"))
            {
                ViewBag.SenderGuid = GetUserGuidByName(User.Identity.Name);
                ViewBag.ReceiverGuid = GetChatRoomGuidByTitle("GlobalChatRoom");
                ViewBag.Messages = GetMessages();
                ViewBag.Users = GetUsers();
                ViewBag.ChatRooms = db.ChatRooms.Include(c => c.Users);
                ViewBag.Title = "GlobalChatRoom";
            }
            else if (db.UserProfiles.FirstOrDefault(u => u.Guid == Receiver) != null)
            {
                ViewBag.SenderGuid = db.UserProfiles.FirstOrDefault(r => r.UserName == User.Identity.Name).Guid;
                ViewBag.ReceiverGuid = Receiver;
                ViewBag.Messages = GetMessages(Receiver);
                ViewBag.Users = GetUsers(Receiver);
                ViewBag.ChatRooms = db.ChatRooms.Include(c => c.Users);
                ViewBag.Title = "Direct chat with " + GetUserNameByGuid(Receiver);
            }
            else//це груповий чат
            {
                ViewBag.SenderGuid = db.UserProfiles.FirstOrDefault(r => r.UserName == User.Identity.Name).Guid;
                //ViewBag.ReceiverGuid = db.ChatRooms.FirstOrDefault(c => c.Guid == Receiver).Guid;
                ViewBag.ReceiverGuid = Receiver;
                ViewBag.Messages = GetMessagesOfChatRoom(Receiver);
                ViewBag.Users = GetUsersOfChatRoom(Receiver);
                ViewBag.ChatRooms = db.ChatRooms.Include(c => c.Users);
                ViewBag.Title = GetChatRoomTitleByGuid(Receiver);
            }
            string TimeZoneId = db.UserProfiles.FirstOrDefault(u => u.UserName == User.Identity.Name).TimeZoneId;
            ViewBag.UserTimeZone = TimeZoneInfo.GetSystemTimeZones().FirstOrDefault(tz => tz.Id == TimeZoneId);
            ViewBag.DefaultChatRoom = db.ChatRooms.FirstOrDefault(cr => cr.Title == "GlobalChatRoom");
            ViewBag.CurrentUser = db.UserProfiles.FirstOrDefault(u => u.UserName == User.Identity.Name);
            ViewBag.ActivityDates = GetActivityDates(Receiver, GetUserGuidByName(User.Identity.Name));
            ViewBag.IsANewMessages = IsAUnreadMessages;
            ViewBag.CurrentUserGuid = GetUserGuidByName(User.Identity.Name);
            ViewBag.LoginColor = db.UserProfiles.FirstOrDefault(u => u.UserName == User.Identity.Name).LoginColor;

            return View();
        }
        public ActionResult ChatRoom(string Receiver)
        {
            if (Receiver == db.ChatRooms.FirstOrDefault(cr => cr.Title == "GlobalChatRoom").Guid)
            {
                ViewBag.Messages = GetMessages();
            }
            else if (db.UserProfiles.FirstOrDefault(u => u.Guid == Receiver) != null)
            {
                ViewBag.Messages = GetMessages(Receiver);
            }
            else
            {
                ViewBag.Messages = GetMessagesOfChatRoom(Receiver);
            }

            string TimeZoneId = db.UserProfiles.FirstOrDefault(u => u.UserName == User.Identity.Name).TimeZoneId;
            ViewBag.UserTimeZone = TimeZoneInfo.GetSystemTimeZones().FirstOrDefault(tz => tz.Id == TimeZoneId);
            ViewBag.ActivityDates = GetActivityDates(Receiver, GetUserGuidByName(User.Identity.Name));

            return View();
        }

        public ActionResult ListOfUsers(string Receiver = null)
        {
            EnterInfoAboutUnreadMessages(GetUserGuidByName(User.Identity.Name));

            if (Receiver == null)
            {
                Receiver = GetChatRoomGuidByTitle("GlobalChatRoom");
            }
            if (Receiver == GetChatRoomGuidByTitle("GlobalChatRoom"))
            {
                ViewBag.Users = GetUsers();
            }
            else if (db.UserProfiles.FirstOrDefault(u => u.Guid == Receiver) != null)
            {
                ViewBag.Users = GetUsers(Receiver);
            }
            else//це груповий чат
            {
                ViewBag.Users = GetUsersOfChatRoom(Receiver);
            }

            ViewBag.CurrentUserGuid = GetUserGuidByName(User.Identity.Name);
            ViewBag.IsANewMessages = IsAUnreadMessages;
            return View();
        }
        public ActionResult ListOfChatRooms()
        {
            EnterInfoAboutUnreadMessages(GetUserGuidByName(User.Identity.Name));

            ViewBag.ChatRooms = db.ChatRooms.Include(c => c.Users);
            ViewBag.IsANewMessages = IsAUnreadMessages;
            return View();
        }

        public ActionResult UserProfilePage()
        {
            ViewBag.ChatRooms = db.ChatRooms.Include(c => c.Users);
            ViewBag.Users = db.UserProfiles;
            ViewBag.ColorType = GetSetOfColorsForView();
            ViewBag.TimeZones = GetSetOfTimeZonesForView();
            ViewBag.DefaultChatRoom = db.ChatRooms.FirstOrDefault(cr => cr.Title == "GlobalChatRoom");
            ViewBag.CurrentUser = db.UserProfiles.FirstOrDefault(u => u.UserName == User.Identity.Name);

            return View();
        }
        private List<SelectListItem> GetSetOfColorsForView()
        {
            List<SelectListItem> SetOfColors = new List<SelectListItem>();
            List<Color> Colors = PrepareColors();
            foreach (Color color in Colors)
            {
                if (color.Name == "Black")
                {
                    SetOfColors.Add(new SelectListItem { Text = color.Name, Value = ColorTranslator.ToHtml(color), Selected = true });
                }
                else
                {
                    SetOfColors.Add(new SelectListItem { Text = color.Name, Value = ColorTranslator.ToHtml(Color.FromArgb(color.ToArgb())) });
                }
            }

            return SetOfColors;
        }
        private List<Color> PrepareColors()
        {
            List<Color> colors = new List<Color>();
            string[] colorNames = Enum.GetNames(typeof(KnownColor));
            foreach (string colorName in colorNames)
            {
                KnownColor knownColor = (KnownColor)Enum.Parse(typeof(KnownColor), colorName);
                //check if the knownColor variable is a System color
                if ((knownColor > KnownColor.Transparent) && (knownColor < KnownColor.ButtonFace))
                {
                    colors.Add(ColorTranslator.FromHtml(colorName));
                }
            }
            return colors;
        }
        private List<SelectListItem> GetSetOfTimeZonesForView()
        {
            List<SelectListItem> SetOfTimeZones = new List<SelectListItem>();
            ReadOnlyCollection<TimeZoneInfo> tzCollection = TimeZoneInfo.GetSystemTimeZones();
            foreach (TimeZoneInfo tz in tzCollection)
            {
                //FLE Standard Time - Київський час.
                if (tz.StandardName == "FLE Standard Time")
                {
                    SetOfTimeZones.Add(new SelectListItem { Text = tz.DisplayName, Value = tz.Id, Selected = true });
                }
                else
                {
                    SetOfTimeZones.Add(new SelectListItem { Text = tz.DisplayName, Value = tz.Id });
                }
            }

            return SetOfTimeZones;
        }
        [HttpPost]
        public void ChangeTimeZone(string TimeZoneId)
        {
            db.UserProfiles.FirstOrDefault(u => u.UserName == User.Identity.Name).TimeZoneId = TimeZoneId;
            db.SaveChanges();
        }
        [HttpPost]
        public void ChangeColorOfLogin(string ColorHex)
        {
            db.UserProfiles.FirstOrDefault(u => u.UserName == User.Identity.Name).LoginColor = ColorHex;
            IEnumerable<Message> MsgToChangeColor = db.Messages.Where(m => m.SenderName == User.Identity.Name);
            foreach (Message msg in MsgToChangeColor)
            {
                msg.TextColor = ColorHex;
            }
            db.SaveChanges();
        }
        [HttpPost]
        public ActionResult CreateConferentionChatRoom(ChatRoom NewCCR, int[] SelectedUsers)
        {
            if (SelectedUsers != null)
            {
                NewCCR.Guid = Guid.NewGuid().ToString();
                foreach (int user in SelectedUsers)
                {
                    NewCCR.Users.Add(db.UserProfiles.Find(user));
                }
                db.ChatRooms.Add(NewCCR);
                db.SaveChanges();
            }
            UpdateListOfUsersAndListOfChatRoomsForAllOnlineUsers();

            return RedirectToAction("UserProfilePage");
        }
        [HttpGet]
        public ActionResult InviteUsersToChatRoom(string ChatRoomGuid)
        {
            ViewBag.ChatRoomGuid = ChatRoomGuid;
            ViewBag.ChatRoom = db.ChatRooms.Include(c => c.Users).FirstOrDefault(cr => cr.Guid == ChatRoomGuid);
            //вибірка юзерів, яких немає в певній чат кімнаті
            List<UserProfile> UsersOfChatRoom = db.ChatRooms.FirstOrDefault(cr => cr.Guid == ChatRoomGuid).Users.ToList();
            List<int> UsersOfChatRoomIds = new List<int>();
            foreach (UserProfile usr in UsersOfChatRoom)
            {
                UsersOfChatRoomIds.Add(usr.UserId);
            }

            List<int> AllUsersIds = new List<int>();
            foreach (UserProfile usr in db.UserProfiles)
            {
                AllUsersIds.Add(usr.UserId);
            }
            IEnumerable<int> usrs = AllUsersIds.Except(UsersOfChatRoomIds);
            List<UserProfile> users = new List<UserProfile>();
            foreach(UserProfile usr in db.UserProfiles)
            {
                if (usrs.Contains(usr.UserId))
                {
                    users.Add(usr);
                }
            }

            ViewBag.Users = users;
            ViewBag.DefaultChatRoom = db.ChatRooms.FirstOrDefault(cr => cr.Title == "GlobalChatRoom");
            ViewBag.CurrentUser = db.UserProfiles.FirstOrDefault(u => u.UserName == User.Identity.Name);

            return PartialView();
        }
        [HttpPost]
        public ActionResult InviteUsersToChatRoom(string ChatRoomGuid, int[] SelectedUsers)
        {
            if (SelectedUsers != null)
            {
                ChatRoom cr = db.ChatRooms.FirstOrDefault(c => c.Guid == ChatRoomGuid);
                foreach (int user in SelectedUsers)
                {
                    cr.Users.Add(db.UserProfiles.Find(user));
                }
                db.SaveChanges();
                UpdateListOfUsersAndListOfChatRoomsForAllOnlineUsers();
            }

            return RedirectToAction("UserProfilePage");
        }
        [HttpGet]
        public ActionResult LeaveChatRoom(string ChatRoomGuid)
        {
            ChatRoom cr = db.ChatRooms.FirstOrDefault(c => c.Guid == ChatRoomGuid);
            UserProfile usr =  db.UserProfiles.FirstOrDefault(u => u.UserName == User.Identity.Name);
            cr.Users.Remove(usr);
            db.SaveChanges();

            UpdateListOfUsersAndListOfChatRoomsForAllOnlineUsers();

            return RedirectToAction("UserProfilePage");
        }

        //запускається, коли юзер покидає сайт
        internal void DeleteUserInformationFromContainersWithTriggers(string CurrentUserGuid)
        {
            if (TriggersForGlobalChatRoomToUpdateChatRoomInViews.ContainsKey(CurrentUserGuid))
            {
                TriggersForGlobalChatRoomToUpdateChatRoomInViews.Remove(CurrentUserGuid);
                TriggersForGlobalChatRoomToUpdateUserActivityInViews.Remove(CurrentUserGuid);
            }

            foreach (UserProfile up in db.UserProfiles)
            {
                if (up.Guid != CurrentUserGuid)
                {
                    if (ContainerForTriggersForDirectMessagesToUpdateChatRoomInViews.FirstOrDefault(item => (item.ContainsKey(up.Guid) && item.ContainsKey(CurrentUserGuid))) != null)
                    {
                        if (ContainerForTriggersForDirectMessagesToUpdateChatRoomInViews.FirstOrDefault(item => (item.ContainsKey(up.Guid) && item.ContainsKey(CurrentUserGuid)))[CurrentUserGuid] != null)
                        {
                            ContainerForTriggersForDirectMessagesToUpdateChatRoomInViews.FirstOrDefault(item => (item.ContainsKey(up.Guid) && item.ContainsKey(CurrentUserGuid)))[CurrentUserGuid].Close();
                            ContainerForTriggersForDirectMessagesToUpdateChatRoomInViews.FirstOrDefault(item => (item.ContainsKey(up.Guid) && item.ContainsKey(CurrentUserGuid)))[CurrentUserGuid] = null;
                        }
                        if (ContainerForTriggersForDirectMessagesToUpdateUserActivityInViews.FirstOrDefault(item => (item.ContainsKey(up.Guid) && item.ContainsKey(CurrentUserGuid)))[CurrentUserGuid] != null)
                        {
                            ContainerForTriggersForDirectMessagesToUpdateUserActivityInViews.FirstOrDefault(item => (item.ContainsKey(up.Guid) && item.ContainsKey(CurrentUserGuid)))[CurrentUserGuid].Close();
                            ContainerForTriggersForDirectMessagesToUpdateUserActivityInViews.FirstOrDefault(item => (item.ContainsKey(up.Guid) && item.ContainsKey(CurrentUserGuid)))[CurrentUserGuid] = null;
                        }

                        //видалення словника, повязані з яким користувачі покинули діалог.
                        Dictionary<string, AutoResetEvent> dic = ContainerForTriggersForDirectMessagesToUpdateChatRoomInViews.FirstOrDefault(item => (item.ContainsKey(up.Guid) && item.ContainsKey(CurrentUserGuid)));
                        if (dic[up.Guid] == null && dic[CurrentUserGuid] == null)
                        {
                            ContainerForTriggersForDirectMessagesToUpdateChatRoomInViews.RemoveAll(item => (item.ContainsKey(up.Guid) && item.ContainsKey(CurrentUserGuid)));
                            ContainerForTriggersForDirectMessagesToUpdateUserActivityInViews.RemoveAll(item => (item.ContainsKey(up.Guid) && item.ContainsKey(CurrentUserGuid)));
                        }
                    }
                }
            }

            foreach (ChatRoom cr in db.ChatRooms)
            {
                if (ContainerForTriggersForConferencesToUpdateChatRoomInViews.ContainsKey(cr.Guid) && ContainerForTriggersForConferencesToUpdateChatRoomInViews[cr.Guid].ContainsKey(CurrentUserGuid))
                {
                    ContainerForTriggersForConferencesToUpdateChatRoomInViews[cr.Guid].Remove(CurrentUserGuid);
                    ContainerForTriggersForConferencesToUpdateUserActivityInViews[cr.Guid].Remove(CurrentUserGuid);
                }
                if (ContainerForTriggersForConferencesToUpdateChatRoomInViews.ContainsKey(cr.Guid) && ContainerForTriggersForConferencesToUpdateChatRoomInViews[cr.Guid].Count == 0)
                {
                    ContainerForTriggersForConferencesToUpdateChatRoomInViews.Remove(cr.Guid);
                    ContainerForTriggersForConferencesToUpdateUserActivityInViews.Remove(cr.Guid);
                }
            }

            TriggersToUpdateIndicatorsOfUnreadMessagesInViews.Remove(CurrentUserGuid);
        }
    }
}