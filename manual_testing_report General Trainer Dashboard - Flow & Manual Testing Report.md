# General Trainer Dashboard - Flow & Manual Testing Report

Gym management system mein ek **General Trainer** ka main kaam hota hai apne clients (members) ko manage karna, unki progress track karna, diet/workout plans banana, aur apni khud ki classes aur shifts manage karna. 

Aapki request par, maine har ek menu item ka **End-to-End Flow (Yeh actual mein kaise kaam karta hai)** aur uski **Manual Testing ke Steps** dono add kar diye hain.

---

## 1. Dashboard (Main Overview)
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Trainer jab apne account mein login karta hai, toh sabse pehle Dashboard load hota hai. Backend system database se aaj (today) ki assigned classes, total active members, pending tasks aur notices (announcements) ka data laata hai aur usey graphs aur shortcut numbers ki tarah screen par show karta hai. Trainer yahan se ek quick nazar maar sakta hai ki uske din ka schedule kya hai.

**🧪 Manual Testing Steps:**
- [ ] Login karne ke baad check karein ki page load hone mein zyada time na le raha ho.
- [ ] Check karein ki numbers (e.g. Total Members) backend/Members tab ke actual count se match ho rahe hain.
- [ ] Dashboard ke kisi bhi shortcut box par click karne par (jaise 'Today's Classes') sahi page khulna chahiye.
- [ ] UI ko mobile device view mein check karein ki graphs/tables screen se bahar na jaa rahe hon (Responsive check).

## 2. Members
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Yahan trainer ko un sabhi members ki list milti hai jo uske under training le rahe hain. Jab koi naya client assign hota hai, vo iss list me aa jata hai. Trainer list scroll kar sakta hai, search box mein naam daal kar dhundh sakta hai. Kisi member pe click karne par uski puri "Profile View" khulti hai jisme uski membership details aur contact info hoti hai.

**🧪 Manual Testing Steps:**
- [ ] **Search/Filter:** Kisi member ka half name ya ID daal kar search karein, result sahi aur fast aana chahiye.
- [ ] **List Data:** Check karein ki table mein column headings (Name, Phone, Status) unke data ke sath align hain.
- [ ] **Action/Click:** Kisi member par click karein aur dekhein ki profile bina kisi error (404/500) ke load ho rahi hai.
- [ ] **Pagination:** Agar 20+ members hain, toh list ke neeche "Next Page" (1, 2, 3) aana chahiye aur correctly next set of users load karne chahiye.

## 3. Client Progress
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Trainer 'Client Progress' mein jaata hai aur dropdown menu se kisi specific client ka naam select karta hai. Select karte hi, system us client ki purani saari health assessments, weight logs, aur gym attendance ka data uthata hai. Iss data ko ek line graph ya bar chart (Timeline) mein convert karke screen par plot karta hai taaki trainer dekh sake ki client improve kar raha hai ya nahi.

**🧪 Manual Testing Steps:**
- [ ] Ek client select karein aur check karein ki graph/chart load ho raha hai ya nahi.
- [ ] Agar client naya hai aur koi data nahi hai, toh system "No data available yet" ka clean message dikhaye (Error nahi aana chahiye).
- [ ] Graph ke data points par mouse hover karein aur check karein ki tooltip mein correct Date aur Weight dikh raha hai.
- [ ] Date Filter (Last 1 Month, Last 6 Months) apply karke check karein ki purana data filter ho raha hai.

## 4. New Assessment
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Jab client gym mein aata hai monthly checkup ke liye, trainer yeh screen kholta hai. Trainer client ka naam select karta hai aur measurements daalta hai (jaise Weight, Body Fat %, Chest, Waist inches mein). Submit button dabane par yeh naya data database mein save hota hai aur uss client ki "Client Progress" timeline mein auto-add ho jata hai.

**🧪 Manual Testing Steps:**
- [ ] **Negative Test:** Form mein bina kuch bhare (empty) "Save" par click karein. Error messages ("This field is required") aane chahiye.
- [ ] **Data Type Check:** Weight wale field mein text "abc" likh kar dekhein, system ko sirf numbers accept karne chahiye.
- [ ] **Positive Test:** Saari details bharein aur Save karein. Success message aana chahiye. Check karein ki yeh data Client Progress mein properly reflect hua hai ya nahi.

## 5. Bodybuilder Assessment
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Yeh normal logon ke liye nahi balki un clients ke liye hai jo body building competitions ke liye prepare kar rahe hain. Isme trainer advanced aur deep measurements dalta hai (e.g. Bicep flexed/unflexed, Quad symmetry). System iss specific form ko normal fitness data se alag categorize karke save karta hai taaki competition prep ko deeply analyze kiya ja sake.

**🧪 Manual Testing Steps:**
- [ ] Check karein ki normal assessment ki jagah isme specific bodybuilding terms aur fields mojud hain ya nahi.
- [ ] Form submit karke check karein ki yeh client profile me 'Bodybuilding log' ke tag ke andar save hua hai.
- [ ] Decimal values (jaise 18.5 inches) enter karke check karein ki system usko accurately save kar raha hai ya nahi.

## 6. Diet Builder
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Trainer ko ek blank meal template milta hai. Vo client select karta hai, aur din ke hisaab se meals add karta hai (e.g., Breakfast: 2 Eggs, Lunch: Rice & Chicken). Jaise-jaise trainer food add karta hai, system database se us food ki nutritional value (Calories, Protein, Carbs) laakar screen par live calculate karke total dikhata hai. "Assign" karne par yeh diet plan member ke app/login portal par live ho jata hai.

**🧪 Manual Testing Steps:**
- [ ] Ek dummy client ke liye 3 meals ka plan banayein.
- [ ] **Calculation Check:** Manually calculator par check karein ki jo food items add kiye hain unka sum system ke total macros (Protein, Calories) se exactly match ho raha hai.
- [ ] Assign karne ke baad check karein ki kya us client ki profile mein current active diet plan display hone lag gaya.
- [ ] Banaye hue plan ko 'Edit' karke items change karein aur 'Delete' button test karein.

## 7. Workout Builder
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Trainer din (jaise Monday: Chest, Tuesday: Back) select karta hai. Ek list/dropdown se vo specific exercises choose karta hai, unke Sets (kitni baar karna hai), Reps (ek baar me kitni ginti) aur Rest Time set karta hai. Final plan save hote hi client ke profile me workout routine assign ho jata hai jise follow karke client apni training karta hai.

**🧪 Manual Testing Steps:**
- [ ] Har din ke according exercises add karne ka flow test karein.
- [ ] Form field constraints check karein (Sets ya Reps me negative number "-5" ya '0' save nahi hona chahiye).
- [ ] Check karein ki workout library me saari basic exercises available hain ya manually custom exercise add karne ka option chal raha hai.

## 8. Health & BMI Log
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Yeh ek quick tool hai. Trainer bas client ki Current Height aur Current Weight enter karta hai. Submit par click hote hi background formula `(Weight in KG / (Height in Meters * Height in Meters))` apply hota hai aur system turant BMI (Body Mass Index) nikal deta hai. Yeh data us din ke timestamp ke sath save ho jata hai.

**🧪 Manual Testing Steps:**
- [ ] Valid Height aur Weight daal kar check karein ki screen par BMI sahi classify ho raha hai (Underweight, Normal, Overweight).
- [ ] Invalid height/weight constraints test karein (Jaise weight > 500kg nahi hona chahiye).
- [ ] Save log karne ke baad past logs ki ek choti list/history neeche dikhni chahiye.

## 9. Classes Schedule
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Trainer ko ek calendar ya timetable (Monday to Sunday) dikhta hai. Usme box bane hote hain ki aaj uski konsi class kitne baje hai (e.g. 5:00 PM Zumba, 6:00 PM Personal Training). Trainer class par click karke dekh sakta hai ki usme kitne log aane wale hain. Agar emergency mein class cancel karni ho toh vo yahan se Cancel par click karta hai, jiske baad booked members ko auto-notification chala jata hai.

**🧪 Manual Testing Steps:**
- [ ] Weekly aur Monthly view ke beech toggle karke dekhein design thik hai.
- [ ] Click karein ek upcoming class par aur enrolled members list check karein.
- [ ] Ek class cancel/reschedule karke dekhein (agar option hai) aur check karein system confirmation mangta hai ya nahi "Are you sure?".

## 10. Shift Management
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Yeh trainer ki khud ki duty ka khata hai. Admin ne jo uski gym mein aane ki shift (Morning 6-12 ya Evening 4-10) lagayi hai, vo yahan calendar me dikhti hai. Trainer yahan se apni total working hours dekh sakta hai, aur agar usko chhutti (Leave) chahiye ya kisi dusre trainer se shift exchange karni hai, toh wo yahan se request bhejta hai jo seedha Manager/Admin ke paas approval ke liye jati hai.

**🧪 Manual Testing Steps:**
- [ ] Check karein ki current week ki assigned shifts accurate timing dikha rahi hain.
- [ ] 'Leave Request' form open karein, date select karein, reason daalein aur Submit karein.
- [ ] Request history table check karein, jahan naza request ka status "Pending" show hona chahiye.

## 11. Attendance
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Trainer jab gym me entry leta hai, toh yahan click karke "Check In" (apni khud ki attendance mark karta hai). Ya phir agar PT clients uske paas session lene aate hain, toh vo ek table me sabhi PT clients ke naam ke aage "Mark Present" karta jata hai taaki sessions count hote rahein. System daily date ke sath yahan se data save karta hai.

**🧪 Manual Testing Steps:**
- [ ] Check-In/Check-out buttons kaam kar rahe hain aur sahi Time Capture kar rahe hain.
- [ ] Ek client ko Present aur dusre ko Absent mark karke verify karein.
- [ ] Past (pichle) days ki attendance open karke check karein ki wo read-only ho, usko modify na kiya ja sake (Prevent fake attendance).

## 12. QR Check-in
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Advance touchless attendance system. Client apne gym app mein QR code open karta hai. Trainer apne tablet/computer mein 'QR Check-in' module kholta hai jisse device ka camera on hota hai. Trainer camera ke aage QR code dikhata hai. System uss QR ko backend database se match karta hai ki membership Active hai ya Expired. Valid hone par screen hara (green) ho jata hai aur attendance lag jati hai.

**🧪 Manual Testing Steps:**
- [ ] **Camera Access:** Feature kholte hi Browser puchega "Allow Camera". Allow karne par camera feed dikhni chahiye.
- [ ] **Valid QR Flow:** Ek active client ka QR scan karein -> 'Success' aur client ka naam display hona chahiye.
- [ ] **Invalid/Expired QR Flow:** Kisi expired membership wale ka QR scan karein -> Lal rang (Red color) mein 'Access Denied / Expired' aana chahiye.

## 13. Inventory & Requests
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Gym mein agar koi treadmill kharab hai ya AC nahi chal raha, toh trainer WhatsApp par message karne ki jagah yahan "Create Issue" karta hai. Vo issue type (Maintenance) aur details likhta hai. Ye ticket gym manager/maintenance dashboard mein create ho jati hai. Jab technician machine thik kar deta hai toh status yahan automatically "Resolved" ho jata hai. Naye dumbbells/mats mangwane ke liye bhi request dali ja sakti hai.

**🧪 Manual Testing Steps:**
- [ ] 'New Request' create karein (Equipment Repair), issue likhein aur Submit karein.
- [ ] User list mein check karein ticket generate hui hai aur status "Pending/Open" hai.
- [ ] Agar file (Photo) attach karne ka option hai, toh machine ki photo attach karke upload test karein.

## 14. Announcements
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Yeh gym ka digital notice board hai. Manager system se broadcast message bhejta hai (jaise: "Diwali holiday on 12th"). Jab trainer apna account login karta hai, use Announcements ke icon par Notification Badge dikhta hai. Click karne par list dikhti hai, unread notices bold hote hain. Click karke read karne ke baad unka status change ho jata hai.

**🧪 Manual Testing Steps:**
- [ ] List View: Saare recent notices properly list ho rahe hain.
- [ ] Unread vs Read: Naye notices highlighted/bold hone chahiye.
- [ ] Click karne ke baad badge (notification count) automatically kam ho jana chahiye.

## 15. Leaderboard
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Yeh ek motivation aur gamification feature hai. Mahine ke end mein backend metrics check karta hai ki kis Trainer ke sabse zyada sessions hue hain aur kis Client ne sabse zyada fat lose kiya hai ya maximum attendance di hai. Un data points ke basis par ek "Top 10" list generate hoti hai. Trainer ispe click karke apni ranking gym staff ke beech mein dekh sakta hai.

**🧪 Manual Testing Steps:**
- [ ] Ranking Check: List ko observe karein ki Rank 1 wale ke points Rank 2 se zyada hone chahiye (Proper Sorting).
- [ ] Toggle Tabs: Agar Trainers aur Clients ke alag tabs hain, toh dono tab par switch karke data refresh check karein.
- [ ] Mahine ya Hafte ka filter kaam kar raha hai aur rankings properly change ho rahi hain.

---

### Pro Testing Tips:
- **Navigation Flow:** Har ek menu item se dusre pe jaldi-jaldi click karke dekhein (e.g. Dashboard -> Members -> Diet Builder). Screen atkni (hang) nahi chahiye aur saara menu properly open hona chahiye.
- **Role Permission:** Check karein ki Trainer apne hi assigned clients ko dekh sake. Usey dusre trainers ke private clients nahi dikhne chahiye.
