using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Drawing;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using WebApplication3.Models;
using WebApplication3.Controllers;
using WebApplication3.Helpers;

namespace WebApplication3
{
    public class MvcApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);

            ViewEngines.Engines.Add(new RazorViewEngine());

            Database.SetInitializer(new ChatDbInitializer());

        }
    }

    public class ChatDbInitializer : DropCreateDatabaseAlways<ChatContext>
    {
        protected override void Seed(ChatContext context)
        {
            UserProfile u0 = new UserProfile { UserName = "d1", Guid = Guid.NewGuid().ToString(), IsOnline = false, LoginColor = ColorTranslator.ToHtml((Color.FromArgb(Color.Black.ToArgb()))), TimeZoneId = TimeZoneInfo.Local.Id, LastExitTime = Convert.ToDateTime("2016-01-01") };
            ChatRoom c0 = new ChatRoom
            {
                Guid = Guid.NewGuid().ToString(),
                Title = "GlobalChatRoom",
                Creator = u0.ToString(),
                Users = new List<UserProfile>() { u0 }
            };
            context.ChatRooms.Add(c0);
            base.Seed(context);
        }
    }

}
