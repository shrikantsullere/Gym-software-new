# GYMSOFT Super Admin Dashboard - Flow & Manual Testing Report

Aapne jo abhi naya image bheja hai, usme jo menu options hain (Jaise: Gym Owners, Plans & Pricing, Manage Sub-Admins) ussey pata chalta hai ki yeh kisi single gym ka "Trainer Dashboard" nahi hai, balki yeh ek **"Super Admin / SaaS Dashboard"** hai. 

Iska matlab hai ki yeh wo main software portal hai jahan se aap bohot saare alag-alag gyms ko apna software bechte hain aur unhe manage karte hain. 

Aapki request ke according, maine iss naye dashboard ke ek-ek menu ka **Work & Flow** aur **Manual Testing Steps** niche detail me likha hai:

---

## 1. Dashboard (Main Overview)
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Super Admin jab login karta hai, toh usey apne software business ki overall growth dikhti hai. Jaise total kitne Gyms software use kar rahe hain, is mahine kitni total payment aayi hai, kitni nayi Leads (inquiries) aayi hain.
**🧪 Manual Testing Steps:**
- [ ] Check karein ki graphs/charts load ho rahe hain aur numbers backend data se match kar rahe hain (Jaise total Gym Owners ki list gin ne par wahi number aaye).
- [ ] Dashboard par lage widgets par click karne se kya wo sahi page par redirect kar rahe hain?
- [ ] Date filters (e.g., 'Last 30 days', 'This Year') change karke dekhein data update hota hai ya nahi.

## 2. Leads / Inquiries
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Jab koi naya Gym apna gym manage karne ke liye aapka software (GYMSOFT) kharidna chahta hai, toh wo website par "Contact Us" form bharta hai. Wo saari inquiries yahan list hoti hain. Aapki sales team inhe call karti hai aur status update karti hai (Jaise: Interested, Callback, Rejected).
**🧪 Manual Testing Steps:**
- [ ] Website se ek dummy inquiry form bharein aur check karein ki wo iss list mein turant (real-time) aa raha hai ya nahi.
- [ ] Kisi lead par click karke uska status 'Pending' se 'Contacted' me change karein aur Save karein.
- [ ] Purani leads ko Search aur Filter karke dekhein.

## 3. Gym Owners
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Yahan un sabhi Gym Owners ki list hoti hai jinhone aapka software kharid liya hai aur active hain. Unki details, unka current package, aur unke gym me kitne members hain ye yahan dikhta hai. Agar koi payment default karta hai, toh aap yahan se uska software access "Suspend" ya "Block" kar sakte hain.
**🧪 Manual Testing Steps:**
- [ ] Search bar test karein (Gym name, Owner name, ya phone number daal kar).
- [ ] Kisi Active gym owner ka status 'Suspended' karke dekhein -> Fir gym owner wale test account se login karke check karein ki system unhe block kar raha hai ya nahi.
- [ ] "Add New Gym Owner" ka form manually bharein aur check karein validations kaam kar rahe hain.

## 4. Request Plan
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Agar kisi Gym Owner ko apna current software plan chota lag raha hai (e.g. limit 100 members ki thi, ab 500 karni hai), toh wo apne panel se "Upgrade Request" bhejta hai. Wo saari request yahan aati hain taaki Super Admin inhe Approve ya Reject kar sake.
**🧪 Manual Testing Steps:**
- [ ] Dummy Gym Owner account se ek request bhejein aur yahan Super Admin panel me refresh karke check karein.
- [ ] Request ko **Approve** karein aur check karein ki kya gym owner ka billing plan update ho gaya.
- [ ] Request ko **Reject** karein (with reason) aur check karein ki kya owner ko rejection email/notification gayi.

## 5. Plans & Pricing
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Super Admin yahan se apne software ke packages (Subscriptions) banata hai. (e.g., Basic Plan: ₹1000/month, Premium Plan: ₹5000/month). Yahan se naye plans create hote hain aur limits (SMS count, member limit) set hoti hai.
**🧪 Manual Testing Steps:**
- [ ] Naya plan banayein jisme Title, Price, aur Duration (Monthly/Yearly) set karein.
- [ ] **Negative testing:** Price mein alphabets "abc" daal kar save karein, error aana chahiye.
- [ ] Delete/Edit function check karein (Agar koi plan delete karein, toh existing users par uska kya asar ho raha hai?).

## 6. Payments
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Gym Owners se jo bhi payment receive hoti hai (via Online gateway like Razorpay/Stripe, ya Bank Transfer), un sabka ledger/history yahan hota hai. Failed, Pending, aur Successful transactions.
**🧪 Manual Testing Steps:**
- [ ] Date range filter test karein.
- [ ] Kisi transaction par click karke uski 'Invoice' (Receipt) download karein aur PDF format/layout check karein.
- [ ] Agar Offline payment add karne ka option hai (Cash received), toh uski entry karke dekhein total revenue update ho raha hai ya nahi.

## 7. Announcements
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Jab Super Admin ko ek hi baar mein saare Gym Owners ko koi zaroori update deni hoti hai (Jaise: "Naya feature add ho gaya hai" ya "Software kal 2 ghante band rahega"), toh wo yahan se broadcast announcement push karta hai.
**🧪 Manual Testing Steps:**
- [ ] Naya message likhein aur Publish karein.
- [ ] Kisi Gym Owner ke panel mein login karke dekhein ki unhe notice header/notification me mila ya nahi.
- [ ] Delete karke dekhein, kya wo users ke dashboard se bhi hat jata hai?

## 8. Setting
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Yeh pure software ki Global Settings hai. Yahan aap apna GYMSOFT ka logo, email SMTP credentials (jis se emails jayenge), SMS gateway API keys, Terms & Conditions, aur Tax (GST) rate set karte hain.
**🧪 Manual Testing Steps:**
- [ ] Logo Update: Ek naya logo upload karein aur check karein ki portal ka main logo change hota hai ya nahi. Size constraint test karein (try uploading a 10MB file, error should appear).
- [ ] Email/Phone details update karke Save karein.
- [ ] Password reset / Security policies ki settings check karein.

## 9. Trial & Automation
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Jab koi Gym owner "14-Day Free Trial" ke liye sign up karta hai, toh uski tracking yahan hoti hai. Automation ke zariye system automatically emails bhejta hai (Jaise Day 1 par "Welcome", Day 13 par "Trial Ending Soon, please upgrade").
**🧪 Manual Testing Steps:**
- [ ] Trial accounts ki list dekhein aur check karein 'Days Left' ka counter sahi count down kar raha hai (based on registration date).
- [ ] Email template editors agar yahan hain, toh template edit karke save karein.
- [ ] System automatically expired trial walo ka status update kar raha hai ya nahi (Manual trigger if possible).

## 10. Manage Sub-Admins
**🚀 Work & Flow (Yeh kaise kaam karta hai):** 
Super Admin akela itna bada software manage nahi kar sakta, uski sales/support team hoti hai. Yahan se naye staff accounts create hote hain, aur "Role-Based Access Control (RBAC)" ke through unhe power milti hai (Jaise Sales wala bas Leads dekh paye, Settings nahi).
**🧪 Manual Testing Steps:**
- [ ] Naya Sub-Admin account create karein, aur usko sirf "Leads" aur "Announcements" ka Role/Permission dein.
- [ ] Uss naye Sub-Admin account se login karke dekhein ki kya Settings, Payments aur Plans hide ho chuke hain (Access denied)?
- [ ] Sub-admin account ko Edit aur Deactivate karke dekhein.

---
**Note:** Kyunki yeh platform bohot sensitive data handle karta hai (Multiple gyms ka data), testing karte waqt hamesha dhyan dein ki ek gym owner kabhi bhi dusre gym owner ka data kisi loophole se access na kar paye.
