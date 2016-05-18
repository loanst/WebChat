using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.Entity;
using System.ComponentModel.DataAnnotations;

namespace WebApplication3.Models
{
    
    public class Message
    {
        public int Id { get; set; }
        public string Sender { get; set; }
        public string SenderName { get; set; }
        public string TextColor { get; set; }
        public string Text { get; set; }
        public string Receiver { get; set; }
        public DateTime Date { get; set; }
    }

    public class ChatRoom
    {
        public int Id { get; set; }
        public string Guid { get; set; }
        public string Title { get; set; }
        public string Creator { get; set; }
        public virtual ICollection<UserProfile> Users { get; set; }

        public ChatRoom()
        {
            Users = new List<UserProfile>();
        }
    }

    public class ActivityDates
    {
        public int Id { get; set; }
        public string Sender { get; set; }
        public string Receiver { get; set; }
        public DateTime LastEnterChatRoomDate { get; set; }
        public DateTime LastExitChatRoomDate { get; set; }
    }


    //Install-Package EntityFramework
    public class ChatContext : DbContext
    {
        public DbSet<Message> Messages { get; set; }
        public DbSet<ChatRoom> ChatRooms { get; set; }
        public DbSet<UserProfile> UserProfiles { get; set; }
        public DbSet<ActivityDates> ActivityDates { get; set; }
    }





}