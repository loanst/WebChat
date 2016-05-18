using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using WebApplication3.Models;
using System.Threading;
using System.Threading.Tasks;
using WebApplication3.Handlers;
using System.Web.SessionState;

namespace WebApplication3.Controllers
{
    //[SessionState(SessionStateBehavior.ReadOnly)]
    public class HomeController : Controller
    {
        ChatContext dbmsg = new ChatContext();
        UsersContext dbusr = new UsersContext();


        public ActionResult Index()
        {
            return View();
        }
        public ActionResult Frame_Chat()
        {
            //До цього методу відбуваються звернення при відправці нових повідомлень.
            //Ціль затримки - надати час для внесення змін в БД,
            //і після цього відобразити оновлені данні в чаті.
            Thread.Sleep(500);
            return View(dbmsg.Messages);

        }
        public ActionResult Frame_ListOfUsers()
        {
            return View();
        }
        public ActionResult Frame_message()
        {
            ViewBag.Sender = "default";
            ViewBag.Receiver = "PUBLIC";
            return View();
        }
        [HttpPost]
        public void SaveInDatabase(Message msg)
        {
            dbmsg.Messages.Add(msg);
            dbmsg.SaveChanges();
            Response.Redirect("Frame_message", false);
            
        }

        //метод перевизначено з метою закриття зєднання з БД.
        protected override void Dispose(bool disposing)
        {
            dbmsg.Dispose();
            base.Dispose(disposing);
        }
        

        static List<AutoResetEvent> ListOfTriggers = new List<AutoResetEvent>();
        //замість Guid використовувати логін
        static Dictionary<Guid, AutoResetEvent> DictionaryOfTriggers = new Dictionary<Guid, AutoResetEvent>();

        //додати можливість приймати словник для ітерацій
        public void UpdateChatForAllClients()
        {
            foreach (KeyValuePair<Guid, AutoResetEvent> kvp in DictionaryOfTriggers)
            {
                kvp.Value.Set();
            }
        }

        [HttpPost]
        public void SaveNewMessageInDatabase(Message msg)
        {
            dbmsg.Messages.Add(msg);
            dbmsg.SaveChanges();

            //Response.Redirect("Main", false);

            UpdateChatForAllClients();
        }

        [HttpPost]
        public void SaveEditedMessageInDatabase(string MsgText, int MsgId)
        {
            IEnumerable<Message> MsgsForEdit = from m in dbmsg.Messages
                                                 where m.Id == MsgId
                                                 select m;
            Message msg = MsgsForEdit.FirstOrDefault();

            msg.Text = MsgText;
            dbmsg.SaveChanges();
            UpdateChatForAllClients();
        }

        public void DeleteMessageFromDatabase(int MsgId)
        {
            //зробити перевірку відповідності логінів юзера який видаляє повідомлення та логіна вказаного в бд для цього повідомлення.

            IEnumerable<Message> MsgsForDelete = from m in dbmsg.Messages
                                                where m.Id == MsgId
                                                select m;


            foreach (Message msg in MsgsForDelete)
            {
                dbmsg.Messages.Remove(msg);
            }
            dbmsg.SaveChanges();

            UpdateChatForAllClients();

            //Response.Redirect("Main", false);
            //return View("Chat");
        }

        //додати можливість реєстрації для чату з 2-х осіб, для окремих групових чатів.
        public string ClientRegistration()
        {
            IEnumerable<UserProfile> user = from usr in dbusr.UserProfiles
                                                   where usr.UserName == User.Identity.Name
                                                   select usr;


            UserProfile CurrentUser = user.FirstOrDefault();
            if (!DictionaryOfTriggers.ContainsKey(Guid.Parse(CurrentUser.Guid)))
            {
                AutoResetEvent trigger = new AutoResetEvent(false);
                DictionaryOfTriggers.Add(Guid.Parse(CurrentUser.Guid), trigger);

                //CurrentUser.IsOnline = true;
            }

            return CurrentUser.Guid.ToString();
        }


        [HttpPost]
        public string WaitForCommand(string UserGuid)
        {
            DictionaryOfTriggers[Guid.Parse(UserGuid)].WaitOne();

            return UserGuid;
        }

        [Authorize]
        public ActionResult Main(string Sender = "default", string Receiver = "GlobalChatRoom")
        {
            //додати генерування Guid при реєстрації

            ViewBag.Sender = User.Identity.Name;

            ViewBag.Receiver = Receiver;
            //ViewBag.CurrentDate = DateTime.UtcNow;

            //створити цю змінну на рівні Application state

            IEnumerable<Message> messages = from msg in dbmsg.Messages
                                            where msg.Receiver == Receiver
                                            select msg;
            ViewBag.Messages = messages;
            IEnumerable<UserProfile> users = dbusr.UserProfiles;
            ViewBag.Users = users;


            return View();
        }



        public ActionResult ChatRoom(string Receiver = "GlobalChatRoom")
        {
            if (Receiver == "GlobalChatRoom")
            {
                //створити цю змінну на рівні Application state
                IEnumerable<Message> messages = from msg in dbmsg.Messages
                                                where msg.Receiver == Receiver
                                                select msg;
                ViewBag.Messages = messages;

            }
            else
            {
                string UserName = "default";//вставити сюди поточний логін
                IEnumerable<Message> messages = from msg in dbmsg.Messages
                                                where msg.Receiver == Receiver
                                                where msg.Sender == UserName
                                                select msg;
                ViewBag.Messages = messages;
            }

            return View();
        }


        public ActionResult ListOfUsers()
        {
            IEnumerable<UserProfile> users = dbusr.UserProfiles;
            ViewBag.Users = users;

            return View();
        }

        public ActionResult EditMessage(int MsgId)
        {
            IEnumerable<Message> MsgsForEdit = from m in dbmsg.Messages
                                                where m.Id == MsgId
                                                select m;


            Message msg = MsgsForEdit.FirstOrDefault();

            //зробити перевірку відповідності логінів юзера який змінює повідомлення та логіна вказаного в бд для цього повідомлення.
            ViewBag.Sender = msg.Sender;
            ViewBag.Id = msg.Id;
            ViewBag.MsgText = msg.Text;

            return View();
        }


        public ActionResult Test()
        {


            return View();
        }


    }
}