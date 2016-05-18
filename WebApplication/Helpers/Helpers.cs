using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using WebApplication3.Controllers;

namespace WebApplication3.Helpers
{
    public static class CustomHelpers
    {
        #region ImgTagToImgSourceConverter
        static Dictionary<string, string> ImgTagToImgSourceConverter = new Dictionary<string, string>()
        {
            { "[acute]","<img src=\"/Content/Emoticons/acute.gif\" />"},
            { "[aggressive]","<img src=\"/Content/Emoticons/aggressive.gif\" />" },
            { "[air_kiss]","<img src=\"/Content/Emoticons/air_kiss.gif\" />" },
            { "[angel]","<img src=\"/Content/Emoticons/angel.gif\" />" },
            { "[bad]","<img src=\"/Content/Emoticons/bad.gif\" />" },
            { "[bb]","<img src=\"/Content/Emoticons/bb.gif\" />" },
            { "[beach]","<img src=\"/Content/Emoticons/beach.gif\" />" },
            { "[beee]","<img src=\"/Content/Emoticons/beee.gif\" />" },
            { "[big_boss]","<img src=\"/Content/Emoticons/big_boss.gif\" />" },
            { "[blum]","<img src=\"/Content/Emoticons/blum.gif\" />" },
            { "[blush]","<img src=\"/Content/Emoticons/blush.gif\" />" },
            { "[boast]","<img src=\"/Content/Emoticons/boast.gif\" />" },
            { "[bomb]","<img src=\"/Content/Emoticons/bomb.gif\" />" },
            { "[boredom]","<img src=\"/Content/Emoticons/boredom.gif\" />" },
            { "[bye]","<img src=\"/Content/Emoticons/bye.gif\" />" },
            { "[clapping]","<img src=\"/Content/Emoticons/clapping.gif\" />" },
            { "[cray]","<img src=\"/Content/Emoticons/cray.gif\" />" },
            { "[crazy]","<img src=\"/Content/Emoticons/crazy.gif\" />" },
            { "[curtsey]","<img src=\"/Content/Emoticons/curtsey.gif\" />" },
            { "[dance]","<img src=\"/Content/Emoticons/dance.gif\" />" },
            { "[dash]","<img src=\"/Content/Emoticons/dash.gif\" />" },
            { "[declare]","<img src=\"/Content/Emoticons/declare.gif\" />" },
            { "[diablo]","<img src=\"/Content/Emoticons/diablo.gif\" />" },
            { "[dirol]","<img src=\"/Content/Emoticons/dirol.gif\" />" },
            { "[don-t_mention]","<img src=\"/Content/Emoticons/don-t_mention.gif\" />" },
            { "[download]","<img src=\"/Content/Emoticons/download.gif\" />" },
            { "[drinks]","<img src=\"/Content/Emoticons/drinks.gif\" />" },
            { "[english_en]","<img src=\"/Content/Emoticons/english_en.gif\" />" },
            { "[first_move]","<img src=\"/Content/Emoticons/first_move.gif\" />" },
            { "[flirt]","<img src=\"/Content/Emoticons/flirt.gif\" />" },
            { "[focus]","<img src=\"/Content/Emoticons/focus.gif\" />" },
            { "[fool]","<img src=\"/Content/Emoticons/fool.gif\" />" },
            { "[friends]","<img src=\"/Content/Emoticons/friends.gif\" />" },
            { "[gamer2]","<img src=\"/Content/Emoticons/gamer2.gif\" />" },
            { "[gamer4]","<img src=\"/Content/Emoticons/gamer4.gif\" />" },
            { "[girl_blum]","<img src=\"/Content/Emoticons/girl_blum.gif\" />" },
            { "[girl_cray]","<img src=\"/Content/Emoticons/girl_cray.gif\" />" },
            { "[girl_crazy]","<img src=\"/Content/Emoticons/girl_crazy.gif\" />" },
            { "[girl_dance]","<img src=\"/Content/Emoticons/girl_dance.gif\" />" },
            { "[girl_devil]","<img src=\"/Content/Emoticons/girl_devil.gif\" />" },
            { "[girl_drink]","<img src=\"/Content/Emoticons/girl_drink.gif\" />" },
            { "[girl_drink1]","<img src=\"/Content/Emoticons/girl_drink1.gif\" />" },
            { "[girl_haha]","<img src=\"/Content/Emoticons/girl_haha.gif\" />" },
            { "[girl_hide]","<img src=\"/Content/Emoticons/girl_hide.gif\" />" },
            { "[girl_hospital]","<img src=\"/Content/Emoticons/girl_hospital.gif\" />" },
            { "[girl_impossible]","<img src=\"/Content/Emoticons/girl_impossible.gif\" />" },
            { "[girl_in_love]","<img src=\"/Content/Emoticons/girl_in_love.gif\" />" },
            { "[girl_mad]","<img src=\"/Content/Emoticons/girl_mad.gif\" />" },
            { "[girl_pinkglassesf]","<img src=\"/Content/Emoticons/girl_pinkglassesf.gif\" />" },
            { "[girl_sad]","<img src=\"/Content/Emoticons/girl_sad.gif\" />" },
            { "[girl_sigh]","<img src=\"/Content/Emoticons/girl_sigh.gif\" />" },
            { "[girl_smile]","<img src=\"/Content/Emoticons/girl_smile.gif\" />" },
            { "[girl_wacko]","<img src=\"/Content/Emoticons/girl_wacko.gif\" />" },
            { "[girl_wink]","<img src=\"/Content/Emoticons/girl_wink.gif\" />" },
            { "[girl_witch]","<img src=\"/Content/Emoticons/girl_witch.gif\" />" },
            { "[give_heart]","<img src=\"/Content/Emoticons/give_heart.gif\" />" },
            { "[give_rose]","<img src=\"/Content/Emoticons/give_rose.gif\" />" },
            { "[good]","<img src=\"/Content/Emoticons/good.gif\" />" },
            { "[heart]","<img src=\"/Content/Emoticons/heart.gif\" />" },
            { "[heat]","<img src=\"/Content/Emoticons/heat.gif\" />" },
            { "[help]","<img src=\"/Content/Emoticons/help.gif\" />" },
            { "[hi]","<img src=\"/Content/Emoticons/hi.gif\" />" },
            { "[hunter]","<img src=\"/Content/Emoticons/hunter.gif\" />" },
            { "[hysteric]","<img src=\"/Content/Emoticons/hysteric.gif\" />" },
            { "[i-m_so_happy]","<img src=\"/Content/Emoticons/i-m_so_happy.gif\" />" },
            { "[ireful]","<img src=\"/Content/Emoticons/ireful.gif\" />" },
            { "[king]","<img src=\"/Content/Emoticons/king.gif\" />" },
            { "[kiss]","<img src=\"/Content/Emoticons/kiss.gif\" />" },
            { "[laugh]","<img src=\"/Content/Emoticons/laugh.gif\" />" },
            { "[lazy]","<img src=\"/Content/Emoticons/lazy.gif\" />" },
            { "[lol]","<img src=\"/Content/Emoticons/lol.gif\" />" },
            { "[mail]","<img src=\"/Content/Emoticons/mail.gif\" />" },
            { "[mamba]","<img src=\"/Content/Emoticons/mamba.gif\" />" },
            { "[man_in_love]","<img src=\"/Content/Emoticons/man_in_love.gif\" />" },
            { "[mda]","<img src=\"/Content/Emoticons/mda.gif\" />" },
            { "[mega_shok]","<img src=\"/Content/Emoticons/mega_shok.gif\" />" },
            { "[moil]","<img src=\"/Content/Emoticons/moil.gif\" />" },
            { "[mosking]","<img src=\"/Content/Emoticons/mosking.gif\" />" },
            { "[music]","<img src=\"/Content/Emoticons/music.gif\" />" },
            { "[nea]","<img src=\"/Content/Emoticons/nea.gif\" />" },
            { "[negative]","<img src=\"/Content/Emoticons/negative.gif\" />" },
            { "[new_russian]","<img src=\"/Content/Emoticons/new_russian.gif\" />" },
            { "[ok]","<img src=\"/Content/Emoticons/ok.gif\" />" },
            { "[on_the_quiet]","<img src=\"/Content/Emoticons/on_the_quiet.gif\" />" },
            { "[padonak]","<img src=\"/Content/Emoticons/padonak.gif\" />" },
            { "[paint]","<img src=\"/Content/Emoticons/paint.gif\" />" },
            { "[pardon]","<img src=\"/Content/Emoticons/pardon.gif\" />" },
            { "[parting]","<img src=\"/Content/Emoticons/parting.gif\" />" },
            { "[party]","<img src=\"/Content/Emoticons/party.gif\" />" },
            { "[pilot]","<img src=\"/Content/Emoticons/pilot.gif\" />" },
            { "[pleasantry]","<img src=\"/Content/Emoticons/pleasantry.gif\" />" },
            { "[popcorm]","<img src=\"/Content/Emoticons/popcorm.gif\" />" },
            { "[prankster]","<img src=\"/Content/Emoticons/prankster.gif\" />" },
            { "[preved]","<img src=\"/Content/Emoticons/preved.gif\" />" },
            { "[punish]","<img src=\"/Content/Emoticons/punish.gif\" />" },
            { "[rofl]","<img src=\"/Content/Emoticons/rofl.gif\" />" },
            { "[rtfm]","<img src=\"/Content/Emoticons/rtfm.gif\" />" },
            { "[russian_ru]","<img src=\"/Content/Emoticons/russian_ru.gif\" />" },
            { "[sad]","<img src=\"/Content/Emoticons/sad.gif\" />" },
            { "[sarcastic]","<img src=\"/Content/Emoticons/sarcastic.gif\" />" },
            { "[sarcastic_blum]","<img src=\"/Content/Emoticons/sarcastic_blum.gif\" />" },
            { "[sarcastic_hand]","<img src=\"/Content/Emoticons/sarcastic_hand.gif\" />" },
            { "[scare]","<img src=\"/Content/Emoticons/scare.gif\" />" },
            { "[scaut]","<img src=\"/Content/Emoticons/scaut.gif\" />" },
            { "[scratch_one-s_head]","<img src=\"/Content/Emoticons/scratch_one-s_head.gif\" />" },
            { "[search]","<img src=\"/Content/Emoticons/search.gif\" />" },
            { "[secret]","<img src=\"/Content/Emoticons/secret.gif\" />" },
            { "[shok]","<img src=\"/Content/Emoticons/shok.gif\" />" },
            { "[shout]","<img src=\"/Content/Emoticons/shout.gif\" />" },
            { "[smile]","<img src=\"/Content/Emoticons/smile.gif\" />" },
            { "[smoke]","<img src=\"/Content/Emoticons/smoke.gif\" />" },
            { "[soldier]","<img src=\"/Content/Emoticons/soldier.gif\" />" },
            { "[soldier_girl]","<img src=\"/Content/Emoticons/soldier_girl.gif\" />" },
            { "[sorry]","<img src=\"/Content/Emoticons/sorry.gif\" />" },
            { "[spiteful]","<img src=\"/Content/Emoticons/spiteful.gif\" />" },
            { "[spruce_up]","<img src=\"/Content/Emoticons/spruce_up.gif\" />" },
            { "[superstition]","<img src=\"/Content/Emoticons/superstition.gif\" />" },
            { "[swoon]","<img src=\"/Content/Emoticons/swoon.gif\" />" },
            { "[tease]","<img src=\"/Content/Emoticons/tease.gif\" />" },
            { "[tender]","<img src=\"/Content/Emoticons/tender.gif\" />" },
            { "[thank_you]","<img src=\"/Content/Emoticons/thank_you.gif\" />" },
            { "[this]","<img src=\"/Content/Emoticons/this.gif\" />" },
            { "[to_become_senile]","<img src=\"/Content/Emoticons/to_become_senile.gif\" />" },
            { "[to_take_umbrage]","<img src=\"/Content/Emoticons/to_take_umbrage.gif\" />" },
            { "[training]","<img src=\"/Content/Emoticons/training.gif\" />" },
            { "[treaten]","<img src=\"/Content/Emoticons/treaten.gif\" />" },
            { "[umnik]","<img src=\"/Content/Emoticons/umnik.gif\" />" },
            { "[unknw]","<img src=\"/Content/Emoticons/unknw.gif\" />" },
            { "[vampire]","<img src=\"/Content/Emoticons/vampire.gif\" />" },
            { "[vava]","<img src=\"/Content/Emoticons/vava.gif\" />" },
            { "[victory]","<img src=\"/Content/Emoticons/victory.gif\" />" },
            { "[wacko]","<img src=\"/Content/Emoticons/wacko.gif\" />" },
            { "[whistle]","<img src=\"/Content/Emoticons/whistle.gif\" />" },
            { "[wink]","<img src=\"/Content/Emoticons/wink.gif\" />" },
            { "[wizard]","<img src=\"/Content/Emoticons/wizard.gif\" />" },
            { "[yahoo]","<img src=\"/Content/Emoticons/yahoo.gif\" />" },
            { "[yes]","<img src=\"/Content/Emoticons/yes.gif\" />" },
            { "[yu]","<img src=\"/Content/Emoticons/yu.gif\" />" },
        };
        #endregion

        public static MvcHtmlString ConvertElementsToHTML(this HtmlHelper html, string MsgText)
        {
            //конвертація цитат
            MsgText = MsgText.Replace("[quoteAuthor]", "<div class='QuoteBody'><div class='QuoteAuthor'>User ").Replace("[/quoteAuthor]", " wrote:</div>").Replace("[quoteText]", "<div class='QuoteText'>").Replace("[/quoteText]", "</div></div>");

            //конвертація смайликів
            foreach (KeyValuePair<string,string> kvp in ImgTagToImgSourceConverter)
            {
                MsgText = MsgText.Replace(kvp.Key, kvp.Value);
            }

            return new MvcHtmlString(MsgText);
        }

        public static string IsNewMessages(this HtmlHelper html, string ChtrGuid)
        {
            string result = "";

            return result;
        }


    }
}