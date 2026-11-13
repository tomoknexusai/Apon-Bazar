import json

# Comprehensive Bangladesh Dataset: 8 Divisions, 64 Districts, Official Upazilas & Unions/Municipalities

divisions_raw = [
    {
        "nameBn": "ঢাকা", "nameEn": "Dhaka",
        "districts": [
            {
                "nameBn": "ঢাকা", "nameEn": "Dhaka",
                "upazilas": [
                    {"nameBn": "ধানমন্ডি", "nameEn": "Dhanmondi", "unions": [
                        {"nameBn": "ধানমন্ডি আ/এ", "nameEn": "Dhanmondi R/A", "postalCode": "1209", "villagesBn": ["মিরপুর রোড", "সোবহানবাগ", "লেকের পাড়", "ধানমন্ডি ২৭", "জিগাতলা"], "villagesEn": ["Mirpur Road", "Sobhanbagh", "Lake Side", "Dhanmondi 27", "Jigatola"]},
                        {"nameBn": "সোবহানবাগ", "nameEn": "Sobhanbagh", "postalCode": "1207", "villagesBn": ["সোবহানবাগ কলোনি", "রাসেল স্কয়ার", "ড্যাফোডিল গলি"], "villagesEn": ["Sobhanbagh Colony", "Russell Square", "Daffodil Alley"]}
                    ]},
                    {"nameBn": "গুলশান", "nameEn": "Gulshan", "unions": [
                        {"nameBn": "গুলশান ১", "nameEn": "Gulshan 1", "postalCode": "1212", "villagesBn": ["গুলশান অ্যাভিনিউ", "রোড ১১", "কালাচাঁদপুর"], "villagesEn": ["Gulshan Avenue", "Road 11", "Kalachandpur"]},
                        {"nameBn": "গুলশান ২", "nameEn": "Gulshan 2", "postalCode": "1212", "villagesBn": ["কূটনৈতিক এলাকা", "সাহাবউদ্দিন পার্ক এলাকা"], "villagesEn": ["Diplomatic Zone", "Shahabuddin Park Area"]}
                    ]},
                    {"nameBn": "মিরপুর", "nameEn": "Mirpur", "unions": [
                        {"nameBn": "মিরপুর ১০", "nameEn": "Mirpur 10", "postalCode": "1216", "villagesBn": ["মিরপুর ১০ গোলচত্বর", "সেনপাড়া পর্বতা", "বাগ্রাবাদ"], "villagesEn": ["Mirpur 10 Circle", "Senpara Parbata", "Bagrabad"]},
                        {"nameBn": "মিরপুর ১", "nameEn": "Mirpur 1", "postalCode": "1216", "villagesBn": ["মুক্তো বাংলা এলাকা", "মাজার রোড", "টোলারবাগ"], "villagesEn": ["Mukto Bangla Area", "Mazar Road", "Tolarbagh"]},
                        {"nameBn": "পল্লবী", "nameEn": "Pallabi", "postalCode": "1216", "villagesBn": ["পল্লবী আবাসিক", "মিরপুর ১২", "কালশী"], "villagesEn": ["Pallabi R/A", "Mirpur 12", "Kalshi"]}
                    ]},
                    {"nameBn": "উত্তরা", "nameEn": "Uttara", "unions": [
                        {"nameBn": "উত্তরা মডেল টাউন", "nameEn": "Uttara Model Town", "postalCode": "1230", "villagesBn": ["সেক্টর ১", "সেক্টর ৩", "সেক্টর ৭", "সেক্টর ১১", "আজমপুর"], "villagesEn": ["Sector 1", "Sector 3", "Sector 7", "Sector 11", "Azampur"]},
                        {"nameBn": "আব্দুল্লাহপুর", "nameEn": "Abdullahpur", "postalCode": "1230", "villagesBn": ["আব্দুল্লাহপুর বাসস্ট্যান্ড", "তুরাগ তীর"], "villagesEn": ["Abdullahpur Bus Stand", "Turag Bank"]}
                    ]},
                    {"nameBn": "সাভার", "nameEn": "Savar", "unions": [
                        {"nameBn": "সাভার পৌরসভা", "nameEn": "Savar Municipality", "postalCode": "1340", "villagesBn": ["সাভার বাজার", "পাকাপুল", "থানা রোড"], "villagesEn": ["Savar Bazar", "Pakapul", "Thana Road"]},
                        {"nameBn": "আমিনবাজার", "nameEn": "Aminbazar", "postalCode": "1348", "villagesBn": ["আমিনবাজার ব্রীজ এলাকা", "বেগুনবাড়ী"], "villagesEn": ["Aminbazar Bridge Area", "Begunbari"]},
                        {"nameBn": "ধামসোনা", "nameEn": "Dhamsona", "postalCode": "1349", "villagesBn": ["বাইপাইল", "ডিইপিজেড এলাকা", "শ্রীপুর"], "villagesEn": ["Baipail", "DEPZ Area", "Sreepur"]},
                        {"nameBn": "আশুলিয়া", "nameEn": "Ashulia", "postalCode": "1341", "villagesBn": ["আশুলিয়া বাজার", "চারাবাগ", "খাগান"], "villagesEn": ["Ashulia Bazar", "Charabag", "Khagan"]}
                    ]},
                    {"nameBn": "কেরানীগঞ্জ", "nameEn": "Keraniganj", "unions": [
                        {"nameBn": "জিনজিরা", "nameEn": "Zinjira", "postalCode": "1310", "villagesBn": ["জিনজিরা বাজার", "চকবাজার ঘাট", "রোহিতপুর রোড"], "villagesEn": ["Zinjira Bazar", "Chawkbazar Ghat", "Rohitpur Road"]},
                        {"nameBn": "শুভাঢ্যা", "nameEn": "Shubhadya", "postalCode": "1310", "villagesBn": ["চুনকুটিয়া", "হাসনাবাদ", "কালীগঞ্জ"], "villagesEn": ["Chunkutia", "Hasnabad", "Kaliganj"]},
                        {"nameBn": "রোহিতপুর", "nameEn": "Rohitpur", "postalCode": "1311", "villagesBn": ["রোহিতপুর বাজার", "লাখামোর"], "villagesEn": ["Rohitpur Bazar", "Lakhamor"]}
                    ]},
                    {"nameBn": "ধামরাই", "nameEn": "Dhamrai", "unions": [
                        {"nameBn": "ধামরাই পৌরসভা", "nameEn": "Dhamrai Municipality", "postalCode": "1350", "villagesBn": ["ধামরাই বাজার", "রথখোলা", "কায়েতপাড়া"], "villagesEn": ["Dhamrai Bazar", "Rathkhola", "Kayetpara"]},
                        {"nameBn": "সোমভাগ", "nameEn": "Sombhag", "postalCode": "1350", "villagesBn": ["সোমভাগ", "ডাউটিয়া"], "villagesEn": ["Sombhag", "Dautia"]}
                    ]},
                    {"nameBn": "দোহার", "nameEn": "Dohar", "unions": [
                        {"nameBn": "জয়পাড়া পৌরসভা", "nameEn": "Joypara Municipality", "postalCode": "1330", "villagesBn": ["জয়পাড়া বাজার", "মালিকান্দা"], "villagesEn": ["Joypara Bazar", "Malikanda"]},
                        {"nameBn": "মুকসুদপুর", "nameEn": "Muksudpur", "postalCode": "1331", "villagesBn": ["মুকসুদপুর", "পদ্মাকুল"], "villagesEn": ["Muksudpur", "Padmakul"]}
                    ]},
                    {"nameBn": "নবাবগঞ্জ", "nameEn": "Nawabganj", "unions": [
                        {"nameBn": "নবাবগঞ্জ সদর", "nameEn": "Nawabganj Sadar", "postalCode": "1320", "villagesBn": ["কলাইকোপা", "বান্দুরা", "যন্ত্রাইল"], "villagesEn": ["Kalaikopa", "Bandura", "Yantraill"]},
                        {"nameBn": "বান্দুরা", "nameEn": "Bandura", "postalCode": "1321", "villagesBn": ["বান্দুরা বাজার", "হাসনাবাদ"], "villagesEn": ["Bandura Bazar", "Hasnabad"]}
                    ]},
                    {"nameBn": "মোহাম্মদপুর", "nameEn": "Mohammadpur", "unions": [
                        {"nameBn": "মোহাম্মদপুর টাউন হল", "nameEn": "Mohammadpur Town Hall", "postalCode": "1207", "villagesBn": ["টাউন হল এলাকা", "আসাদ এভিনিউ", "জাপান গার্ডেন সিটি"], "villagesEn": ["Town Hall Area", "Asad Avenue", "Japan Garden City"]},
                        {"nameBn": "নবোদয় হাউজিং", "nameEn": "Nobojoy Housing", "postalCode": "1207", "villagesBn": ["নবোদয় বোরহান রোড", "শেখেটেক", "বসিলা রোড"], "villagesEn": ["Nobojoy Borhan Road", "Shekhertek", "Bosila Road"]}
                    ]},
                    {"nameBn": "তেজগাঁও", "nameEn": "Tejgaon", "unions": [
                        {"nameBn": "তেজগাঁও শিল্প এলাকা", "nameEn": "Tejgaon I/A", "postalCode": "1208", "villagesBn": ["চ্যানেল আই রোড", "নাখালপাড়া", "কারওয়ান বাজার"], "villagesEn": ["Channel i Road", "Nakhalpara", "Karwan Bazar"]}
                    ]},
                    {"nameBn": "মতিঝিল", "nameEn": "Motijheel", "unions": [
                        {"nameBn": "মতিঝিল বাণিজ্যিক এলাকা", "nameEn": "Motijheel C/A", "postalCode": "1000", "villagesBn": ["শাপলা চত্বর", "ডিআইটি রোড", "কমলাপুর"], "villagesEn": ["Shapla Chattar", "DIT Road", "Kamalapur"]}
                    ]},
                    {"nameBn": "বাড্ডা", "nameEn": "Badda", "unions": [
                        {"nameBn": "উত্তর বাড্ডা", "nameEn": "North Badda", "postalCode": "1212", "villagesBn": ["মেরুল বাড্ডা", "প্রগতি সরণি", "সাতারকুল"], "villagesEn": ["Merul Badda", "Pragati Sarani", "Satarkul"]}
                    ]}
                ]
            },
            {
                "nameBn": "গাজীপুর", "nameEn": "Gazipur",
                "upazilas": [
                    {"nameBn": "গাজীপুর সদর", "nameEn": "Gazipur Sadar", "unions": [
                        {"nameBn": "গাজীপুর চৌরাস্তা", "nameEn": "Gazipur Chourasta", "postalCode": "1700", "villagesBn": ["চৌরাস্তা বাজার", "শিববাড়ী", "বোর্ড বাজার"], "villagesEn": ["Chourasta Bazar", "Shibbari", "Board Bazar"]}
                    ]},
                    {"nameBn": "কালিয়াকৈর", "nameEn": "Kaliakair", "unions": [
                        {"nameBn": "কালিয়াকৈর পৌরসভা", "nameEn": "Kaliakair Municipality", "postalCode": "1750", "villagesBn": ["চন্দ্রা", "কালিয়াকৈর বাজার"], "villagesEn": ["Chandra", "Kaliakair Bazar"]}
                    ]},
                    {"nameBn": "কালীগঞ্জ", "nameEn": "Kaliganj", "unions": [
                        {"nameBn": "কালীগঞ্জ পৌরসভা", "nameEn": "Kaliganj Municipality", "postalCode": "1720", "villagesBn": ["কালীগঞ্জ বাজার", "তুমুলিয়া"], "villagesEn": ["Kaliganj Bazar", "Tumulia"]}
                    ]},
                    {"nameBn": "কাপাসিয়া", "nameEn": "Kapasia", "unions": [
                        {"nameBn": "কাপাসিয়া সদর", "nameEn": "Kapasia Sadar", "postalCode": "1730", "villagesBn": ["কাপাসিয়া বাজার", "ঘাগটিয়া"], "villagesEn": ["Kapasia Bazar", "Ghagatia"]}
                    ]},
                    {"nameBn": "শ্রীপুর", "nameEn": "Sreepur", "unions": [
                        {"nameBn": "শ্রীপুর পৌরসভা", "nameEn": "Sreepur Municipality", "postalCode": "1740", "villagesBn": ["মাওনা চৌরাস্তা", "শ্রীপুর বাজার"], "villagesEn": ["Mawna Chourasta", "Sreepur Bazar"]}
                    ]},
                    {"nameBn": "টঙ্গী", "nameEn": "Tongi", "unions": [
                        {"nameBn": "টঙ্গী বিসিক", "nameEn": "Tongi BSCIC", "postalCode": "1710", "villagesBn": ["টঙ্গী বাজার", "ইজতেমা ময়দান এলাকা", "কলেজ গেট"], "villagesEn": ["Tongi Bazar", "Ijtema Maidan Area", "College Gate"]}
                    ]}
                ]
            },
            {
                "nameBn": "নারায়ণগঞ্জ", "nameEn": "Narayanganj",
                "upazilas": [
                    {"nameBn": "নারায়ণগঞ্জ সদর", "nameEn": "Narayanganj Sadar", "unions": [
                        {"nameBn": "নারায়ণগঞ্জ পৌরসভা", "nameEn": "Narayanganj City", "postalCode": "1400", "villagesBn": ["চাষাড়া", "নিতাইগঞ্জ", "মণ্ডলপাড়া"], "villagesEn": ["Chashara", "Nitaiganj", "Mondolpara"]}
                    ]},
                    {"nameBn": "বন্দর", "nameEn": "Bandar", "unions": [
                        {"nameBn": "বন্দর সদর", "nameEn": "Bandar Sadar", "postalCode": "1410", "villagesBn": ["বন্দর বাজার", "ধামগড়", "কদম রসুল"], "villagesEn": ["Bandar Bazar", "Dhamgarh", "Kadam Rasul"]}
                    ]},
                    {"nameBn": "আড়াইহাজার", "nameEn": "Araihazar", "unions": [
                        {"nameBn": "আড়াইহাজার পৌরসভা", "nameEn": "Araihazar Municipality", "postalCode": "1450", "villagesBn": ["আড়াইহাজার বাজার", "গোপালদী"], "villagesEn": ["Araihazar Bazar", "Gopaldi"]}
                    ]},
                    {"nameBn": "রূপগঞ্জ", "nameEn": "Rupganj", "unions": [
                        {"nameBn": "রূপগঞ্জ সদর", "nameEn": "Rupganj Sadar", "postalCode": "1460", "villagesBn": ["ভুলতা", "গাউছিয়া", "কাঁচপুর"], "villagesEn": ["Bhulta", "Gauchhia", "Kanchpur"]}
                    ]},
                    {"nameBn": "সোনারগাঁ", "nameEn": "Sonargaon", "unions": [
                        {"nameBn": "সোনারগাঁ পৌরসভা", "nameEn": "Sonargaon Municipality", "postalCode": "1440", "villagesBn": ["পানাম নগর", "মোগরাপাড়া", "জাদুঘর এলাকা"], "villagesEn": ["Panam City", "Mograpara", "Museum Area"]}
                    ]}
                ]
            },
            {
                "nameBn": "নরসিংদী", "nameEn": "Narsingdi",
                "upazilas": [
                    {"nameBn": "নরসিংদী সদর", "nameEn": "Narsingdi Sadar", "unions": [{"nameBn": "নরসিংদী পৌরসভা", "nameEn": "Narsingdi Municipality", "postalCode": "1600", "villagesBn": ["স্টেশন রোড", "জেলখানা মোড়", "ভেলানগর"], "villagesEn": ["Station Road", "Jailkhana More", "Velanagar"]}]},
                    {"nameBn": "বেলাবো", "nameEn": "Belabo", "unions": [{"nameBn": "বেলাবো সদর", "nameEn": "Belabo Sadar", "postalCode": "1640", "villagesBn": ["বেলাবো বাজার"], "villagesEn": ["Belabo Bazar"]}]},
                    {"nameBn": "মনোহরদী", "nameEn": "Monohardi", "unions": [{"nameBn": "মনোহরদী পৌরসভা", "nameEn": "Monohardi Municipality", "postalCode": "1650", "villagesBn": ["মনোহরদী বাজার"], "villagesEn": ["Monohardi Bazar"]}]},
                    {"nameBn": "পলাশ", "nameEn": "Palash", "unions": [{"nameBn": "ঘোড়াশাল পৌরসভা", "nameEn": "Ghorashal Municipality", "postalCode": "1610", "villagesBn": ["ঘোড়াশাল বাজার"], "villagesEn": ["Ghorashal Bazar"]}]},
                    {"nameBn": "রায়পুরা", "nameEn": "Raipura", "unions": [{"nameBn": "রায়পুরা পৌরসভা", "nameEn": "Raipura Municipality", "postalCode": "1630", "villagesBn": ["রায়পুরা বাজার"], "villagesEn": ["Raipura Bazar"]}]},
                    {"nameBn": "শিবপুর", "nameEn": "Shibpur", "unions": [{"nameBn": "শিবপুর সদর", "nameEn": "Shibpur Sadar", "postalCode": "1620", "villagesBn": ["শিবপুর বাজার"], "villagesEn": ["Shibpur Bazar"]}]}
                ]
            },
            {
                "nameBn": "টাঙ্গাইল", "nameEn": "Tangail",
                "upazilas": [
                    {"nameBn": "টাঙ্গাইল সদর", "nameEn": "Tangail Sadar", "unions": [{"nameBn": "টাঙ্গাইল পৌরসভা", "nameEn": "Tangail Municipality", "postalCode": "1900", "villagesBn": ["আকুর টাকুর পাড়া", "পৌর বাজার"], "villagesEn": ["Akur Thakur Para", "Poura Bazar"]}]},
                    {"nameBn": "মির্জাপুর", "nameEn": "Mirzapur", "unions": [{"nameBn": "মির্জাপুর পৌরসভা", "nameEn": "Mirzapur Municipality", "postalCode": "1940", "villagesBn": ["ক্যাডেট কলেজ এলাকা", "মির্জাপুর বাজার"], "villagesEn": ["Cadet College Area", "Mirzapur Bazar"]}]},
                    {"nameBn": "মধুপুর", "nameEn": "Madhupur", "unions": [{"nameBn": "মধুপুর পৌরসভা", "nameEn": "Madhupur Municipality", "postalCode": "1996", "villagesBn": ["মধুপুর বাজার"], "villagesEn": ["Madhupur Bazar"]}]},
                    {"nameBn": "ঘাটাইল", "nameEn": "Ghatail", "unions": [{"nameBn": "ঘাটাইল পৌরসভা", "nameEn": "Ghatail Municipality", "postalCode": "1980", "villagesBn": ["ঘাটাইল বাজার"], "villagesEn": ["Ghatail Bazar"]}]},
                    {"nameBn": "কালিহাতী", "nameEn": "Kalihati", "unions": [{"nameBn": "কালিহাতী পৌরসভা", "nameEn": "Kalihati Municipality", "postalCode": "1970", "villagesBn": ["কালিহাতী বাজার"], "villagesEn": ["Kalihati Bazar"]}]},
                    {"nameBn": "গোপালপুর", "nameEn": "Gopalpur", "unions": [{"nameBn": "গোপালপুর পৌরসভা", "nameEn": "Gopalpur Municipality", "postalCode": "1990", "villagesBn": ["গোপালপুর বাজার"], "villagesEn": ["Gopalpur Bazar"]}]},
                    {"nameBn": "সখিপুর", "nameEn": "Sakhipur", "unions": [{"nameBn": "সখিপুর পৌরসভা", "nameEn": "Sakhipur Municipality", "postalCode": "1950", "villagesBn": ["সখিপুর বাজার"], "villagesEn": ["Sakhipur Bazar"]}]},
                    {"nameBn": "বাসাইল", "nameEn": "Basail", "unions": [{"nameBn": "বাসাইল সদর", "nameEn": "Basail Sadar", "postalCode": "1920", "villagesBn": ["বাসাইল বাজার"], "villagesEn": ["Basail Bazar"]}]},
                    {"nameBn": "ভূঞাপুর", "nameEn": "Bhuapur", "unions": [{"nameBn": "ভূঞাপুর পৌরসভা", "nameEn": "Bhuapur Municipality", "postalCode": "1960", "villagesBn": ["ভূঞাপুর বাজার"], "villagesEn": ["Bhuapur Bazar"]}]},
                    {"nameBn": "দেলদুয়ার", "nameEn": "Delduar", "unions": [{"nameBn": "দেলদুয়ার সদর", "nameEn": "Delduar Sadar", "postalCode": "1910", "villagesBn": ["দেলদুয়ার বাজার"], "villagesEn": ["Delduar Bazar"]}]},
                    {"nameBn": "ধনবাড়ী", "nameEn": "Dhanbari", "unions": [{"nameBn": "ধনবাড়ী পৌরসভা", "nameEn": "Dhanbari Municipality", "postalCode": "1997", "villagesBn": ["ধনবাড়ী বাজার"], "villagesEn": ["Dhanbari Bazar"]}]},
                    {"nameBn": "নাগরপুর", "nameEn": "Nagarpur", "unions": [{"nameBn": "নাগরপুর সদর", "nameEn": "Nagarpur Sadar", "postalCode": "1930", "villagesBn": ["নাগরপুর বাজার"], "villagesEn": ["Nagarpur Bazar"]}]}
                ]
            },
            {
                "nameBn": "ফরিদপুর", "nameEn": "Faridpur",
                "upazilas": [
                    {"nameBn": "ফরিদপুর সদর", "nameEn": "Faridpur Sadar", "unions": [{"nameBn": "ফরিদপুর পৌরসভা", "nameEn": "Faridpur Municipality", "postalCode": "7800", "villagesBn": ["ঝিলটুলী", "গোয়ালচামট"], "villagesEn": ["Jhiltuli", "Goalchamot"]}]},
                    {"nameBn": "ভাঙ্গা", "nameEn": "Bhanga", "unions": [{"nameBn": "ভাঙ্গা পৌরসভা", "nameEn": "Bhanga Municipality", "postalCode": "7830", "villagesBn": ["ভাঙ্গা ইন্টারচেঞ্জ এলাকা", "ভাঙ্গা বাজার"], "villagesEn": ["Bhanga Interchange Area", "Bhanga Bazar"]}]},
                    {"nameBn": "বোয়ালমারী", "nameEn": "Boalmari", "unions": [{"nameBn": "বোয়ালমারী পৌরসভা", "nameEn": "Boalmari Municipality", "postalCode": "7860", "villagesBn": ["বোয়ালমারী বাজার"], "villagesEn": ["Boalmari Bazar"]}]},
                    {"nameBn": "আলফাডাঙ্গা", "nameEn": "Alfadanga", "unions": [{"nameBn": "আলফাডাঙ্গা সদর", "nameEn": "Alfadanga Sadar", "postalCode": "7870", "villagesBn": ["আলফাডাঙ্গা বাজার"], "villagesEn": ["Alfadanga Bazar"]}]},
                    {"nameBn": "চরভদ্রাসন", "nameEn": "Charbhadrasan", "unions": [{"nameBn": "চরভদ্রাসন সদর", "nameEn": "Charbhadrasan Sadar", "postalCode": "7840", "villagesBn": ["চরভদ্রাসন বাজার"], "villagesEn": ["Charbhadrasan Bazar"]}]},
                    {"nameBn": "মধুখালী", "nameEn": "Madhukhali", "unions": [{"nameBn": "মধুখালী পৌরসভা", "nameEn": "Madhukhali Municipality", "postalCode": "7850", "villagesBn": ["মধুখালী বাজার"], "villagesEn": ["Madhukhali Bazar"]}]},
                    {"nameBn": "নগরকান্দা", "nameEn": "Nagarkanda", "unions": [{"nameBn": "নগরকান্দা পৌরসভা", "nameEn": "Nagarkanda Municipality", "postalCode": "7810", "villagesBn": ["নগরকান্দা বাজার"], "villagesEn": ["Nagarkanda Bazar"]}]},
                    {"nameBn": "সদরপুর", "nameEn": "Sadarpur", "unions": [{"nameBn": "সদরপুর সদর", "nameEn": "Sadarpur Sadar", "postalCode": "7820", "villagesBn": ["সদরপুর বাজার"], "villagesEn": ["Sadarpur Bazar"]}]},
                    {"nameBn": "সালথা", "nameEn": "Saltha", "unions": [{"nameBn": "সালথা সদর", "nameEn": "Saltha Sadar", "postalCode": "7811", "villagesBn": ["সালথা বাজার"], "villagesEn": ["Saltha Bazar"]}]}
                ]
            },
            {
                "nameBn": "গোপালগঞ্জ", "nameEn": "Gopalganj",
                "upazilas": [
                    {"nameBn": "গোপালগঞ্জ সদর", "nameEn": "Gopalganj Sadar", "unions": [{"nameBn": "গোপালগঞ্জ পৌরসভা", "nameEn": "Gopalganj Municipality", "postalCode": "8100", "villagesBn": ["পৌর বাজার", "জোহরা মার্কেট"], "villagesEn": ["Poura Bazar", "Johra Market"]}]},
                    {"nameBn": "টুঙ্গিপাড়া", "nameEn": "Tungipara", "unions": [{"nameBn": "টুঙ্গিপাড়া পৌরসভা", "nameEn": "Tungipara Municipality", "postalCode": "8120", "villagesBn": ["টুঙ্গিপাড়া বাজার", "সমাধি সৌধ এলাকা"], "villagesEn": ["Tungipara Bazar", "Mausoleum Area"]}]},
                    {"nameBn": "কাশিয়ানী", "nameEn": "Kashiani", "unions": [{"nameBn": "কাশিয়ানী সদর", "nameEn": "Kashiani Sadar", "postalCode": "8130", "villagesBn": ["কাশিয়ানী বাজার"], "villagesEn": ["Kashiani Bazar"]}]},
                    {"nameBn": "কোটালীপাড়া", "nameEn": "Kotalipara", "unions": [{"nameBn": "কোটালীপাড়া পৌরসভা", "nameEn": "Kotalipara Municipality", "postalCode": "8110", "villagesBn": ["কোটালীপাড়া বাজার"], "villagesEn": ["Kotalipara Bazar"]}]},
                    {"nameBn": "মুকসুদপুর", "nameEn": "Muksudpur", "unions": [{"nameBn": "মুকসুদপুর পৌরসভা", "nameEn": "Muksudpur Municipality", "postalCode": "8140", "villagesBn": ["মুকসুদপুর বাজার"], "villagesEn": ["Muksudpur Bazar"]}]}
                ]
            },
            {
                "nameBn": "কিশোরগঞ্জ", "nameEn": "Kishoreganj",
                "upazilas": [
                    {"nameBn": "কিশোরগঞ্জ সদর", "nameEn": "Kishoreganj Sadar", "unions": [{"nameBn": "কিশোরগঞ্জ পৌরসভা", "nameEn": "Kishoreganj Municipality", "postalCode": "2300", "villagesBn": ["শোলাকিয়া", "পৌর বাজার"], "villagesEn": ["Sholakia", "Poura Bazar"]}]},
                    {"nameBn": "ভৈরব", "nameEn": "Bhairab", "unions": [{"nameBn": "ভৈরব পৌরসভা", "nameEn": "Bhairab Municipality", "postalCode": "2350", "villagesBn": ["ভৈরব বাজার", "রেলওয়ে জংশন এলাকা"], "villagesEn": ["Bhairab Bazar", "Railway Junction Area"]}]},
                    {"nameBn": "বাজিতপুর", "nameEn": "Bajitpur", "unions": [{"nameBn": "বাজিতপুর পৌরসভা", "nameEn": "Bajitpur Municipality", "postalCode": "2330", "villagesBn": ["বাজিতপুর বাজার"], "villagesEn": ["Bajitpur Bazar"]}]},
                    {"nameBn": "হোসেনপুর", "nameEn": "Hossenpur", "unions": [{"nameBn": "হোসেনপুর পৌরসভা", "nameEn": "Hossenpur Municipality", "postalCode": "2320", "villagesBn": ["হোসেনপুর বাজার"], "villagesEn": ["Hossenpur Bazar"]}]},
                    {"nameBn": "ইটনা", "nameEn": "Itna", "unions": [{"nameBn": "ইটনা সদর", "nameEn": "Itna Sadar", "postalCode": "2390", "villagesBn": ["ইটনা হাওর এলাকা"], "villagesEn": ["Itna Haor Area"]}]},
                    {"nameBn": "করিমগঞ্জ", "nameEn": "Karimganj", "unions": [{"nameBn": "করিমগঞ্জ পৌরসভা", "nameEn": "Karimganj Municipality", "postalCode": "2310", "villagesBn": ["করিমগঞ্জ বাজার"], "villagesEn": ["Karimganj Bazar"]}]},
                    {"nameBn": "কটিয়াদী", "nameEn": "Katiadi", "unions": [{"nameBn": "কটিয়াদী পৌরসভা", "nameEn": "Katiadi Municipality", "postalCode": "2340", "villagesBn": ["কটিয়াদী বাজার"], "villagesEn": ["Katiadi Bazar"]}]},
                    {"nameBn": "কুলিয়ারচর", "nameEn": "Kuliarchar", "unions": [{"nameBn": "কুলিয়ারচর পৌরসভা", "nameEn": "Kuliarchar Municipality", "postalCode": "2360", "villagesBn": ["কুলিয়ারচর বাজার"], "villagesEn": ["Kuliarchar Bazar"]}]},
                    {"nameBn": "মিঠামইন", "nameEn": "Mithamain", "unions": [{"nameBn": "মিঠামইন সদর", "nameEn": "Mithamain Sadar", "postalCode": "2370", "villagesBn": ["মিঠামইন অলওয়েদার রোড এলাকা"], "villagesEn": ["Mithamain All Weather Road Area"]}]},
                    {"nameBn": "নিকলী", "nameEn": "Nikli", "unions": [{"nameBn": "নিকলী সদর", "nameEn": "Nikli Sadar", "postalCode": "2380", "villagesBn": ["নিকলী বেড়িবাঁধ এলাকা"], "villagesEn": ["Nikli Beribandh Area"]}]},
                    {"nameBn": "পাকুন্দিয়া", "nameEn": "Pakundia", "unions": [{"nameBn": "পাকুন্দিয়া পৌরসভা", "nameEn": "Pakundia Municipality", "postalCode": "2326", "villagesBn": ["পাকুন্দিয়া বাজার"], "villagesEn": ["Pakundia Bazar"]}]},
                    {"nameBn": "তাড়াইল", "nameEn": "Tarail", "unions": [{"nameBn": "তাড়াইল সদর", "nameEn": "Tarail Sadar", "postalCode": "2316", "villagesBn": ["তাড়াইল বাজার"], "villagesEn": ["Tarail Bazar"]}]},
                    {"nameBn": "অষ্টগ্রাম", "nameEn": "Austagram", "unions": [{"nameBn": "অষ্টগ্রাম সদর", "nameEn": "Austagram Sadar", "postalCode": "2376", "villagesBn": ["অষ্টগ্রাম হাওর এলাকা"], "villagesEn": ["Austagram Haor Area"]}]}
                ]
            },
            {
                "nameBn": "মাদারীপুর", "nameEn": "Madaripur",
                "upazilas": [
                    {"nameBn": "মাদারীপুর সদর", "nameEn": "Madaripur Sadar", "unions": [{"nameBn": "মাদারীপুর পৌরসভা", "nameEn": "Madaripur Municipality", "postalCode": "7900", "villagesBn": ["পুরান বাজার", "পৌর বাজার"], "villagesEn": ["Puran Bazar", "Poura Bazar"]}]},
                    {"nameBn": "শিবচর", "nameEn": "Shivchar", "unions": [{"nameBn": "শিবচর পৌরসভা", "nameEn": "Shivchar Municipality", "postalCode": "7930", "villagesBn": ["পদ্মা সেতু এক্সপ্রেসওয়ে এলাকা", "শিবচর বাজার"], "villagesEn": ["Padma Bridge Expressway Area", "Shivchar Bazar"]}]},
                    {"nameBn": "কালকিনি", "nameEn": "Kalkini", "unions": [{"nameBn": "কালকিনি পৌরসভা", "nameEn": "Kalkini Municipality", "postalCode": "7910", "villagesBn": ["কালকিনি বাজার"], "villagesEn": ["Kalkini Bazar"]}]},
                    {"nameBn": "রাজৈর", "nameEn": "Rajoir", "unions": [{"nameBn": "রাজৈর পৌরসভা", "nameEn": "Rajoir Municipality", "postalCode": "7920", "villagesBn": ["রাজৈর বাজার"], "villagesEn": ["Rajoir Bazar"]}]},
                    {"nameBn": "ডাসার", "nameEn": "Dasar", "unions": [{"nameBn": "ডাসার সদর", "nameEn": "Dasar Sadar", "postalCode": "7911", "villagesBn": ["ডাসার বাজার"], "villagesEn": ["Dasar Bazar"]}]}
                ]
            },
            {
                "nameBn": "মানিকগঞ্জ", "nameEn": "Manikganj",
                "upazilas": [
                    {"nameBn": "মানিকগঞ্জ সদর", "nameEn": "Manikganj Sadar", "unions": [{"nameBn": "মানিকগঞ্জ পৌরসভা", "nameEn": "Manikganj Municipality", "postalCode": "1800", "villagesBn": ["বেউথা", "বাসস্ট্যান্ড এলাকা"], "villagesEn": ["Beutha", "Bus Stand Area"]}]},
                    {"nameBn": "সিংগাইর", "nameEn": "Singair", "unions": [{"nameBn": "সিংগাইর পৌরসভা", "nameEn": "Singair Municipality", "postalCode": "1820", "villagesBn": ["সিংগাইর বাজার"], "villagesEn": ["Singair Bazar"]}]},
                    {"nameBn": "শিবালয়", "nameEn": "Shibalaya", "unions": [{"nameBn": "শিবালয় সদর (পাটুরিয়া)", "nameEn": "Shibalaya Sadar (Paturia)", "postalCode": "1850", "villagesBn": ["পাটুরিয়া ফেরিঘাট এলাকা", "শিবালয় বাজার"], "villagesEn": ["Paturia Ferry Ghat Area", "Shibalaya Bazar"]}]},
                    {"nameBn": "সাটুরিয়া", "nameEn": "Saturia", "unions": [{"nameBn": "সাটুরিয়া সদর", "nameEn": "Saturia Sadar", "postalCode": "1810", "villagesBn": ["সাটুরিয়া বাজার"], "villagesEn": ["Saturia Bazar"]}]},
                    {"nameBn": "ঘিওর", "nameEn": "Ghior", "unions": [{"nameBn": "ঘিওর সদর", "nameEn": "Ghior Sadar", "postalCode": "1840", "villagesBn": ["ঘিওর বাজার"], "villagesEn": ["Ghior Bazar"]}]},
                    {"nameBn": "দৌলতপুর", "nameEn": "Daulatpur", "unions": [{"nameBn": "দৌলতপুর সদর", "nameEn": "Daulatpur Sadar", "postalCode": "1830", "villagesBn": ["দৌলতপুর বাজার"], "villagesEn": ["Daulatpur Bazar"]}]},
                    {"nameBn": "হরিরামপুর", "nameEn": "Harirampur", "unions": [{"nameBn": "হরিরামপুর সদর", "nameEn": "Harirampur Sadar", "postalCode": "1860", "villagesBn": ["ঝাঝরা", "হরিরামপুর বাজার"], "villagesEn": ["Jhajhra", "Harirampur Bazar"]}]}
                ]
            },
            {
                "nameBn": "মুন্সীগঞ্জ", "nameEn": "Munshiganj",
                "upazilas": [
                    {"nameBn": "মুন্সীগঞ্জ সদর", "nameEn": "Munshiganj Sadar", "unions": [{"nameBn": "মুন্সীগঞ্জ পৌরসভা", "nameEn": "Munshiganj Municipality", "postalCode": "1500", "villagesBn": ["মুক্তারপুর", "হাটলক্ষ্মীগঞ্জ"], "villagesEn": ["Muktarpur", "Hatlakshmiganj"]}]},
                    {"nameBn": "গজারিয়া", "nameEn": "Gazaria", "unions": [{"nameBn": "গজারিয়া সদর", "nameEn": "Gazaria Sadar", "postalCode": "1510", "villagesBn": ["ভবেরচর", "গজারিয়া বাজার"], "villagesEn": ["Bhaberchar", "Gazaria Bazar"]}]},
                    {"nameBn": "শ্রীনগর", "nameEn": "Sreenagar", "unions": [{"nameBn": "শ্রীনগর পৌরসভা", "nameEn": "Sreenagar Municipality", "postalCode": "1550", "villagesBn": ["শ্রীনগর বাজার", "হাসাবাদ"], "villagesEn": ["Sreenagar Bazar", "Hasabad"]}]},
                    {"nameBn": "সিরাজদিখান", "nameEn": "Sirajdikhan", "unions": [{"nameBn": "সিরাজদিখান সদর", "nameEn": "Sirajdikhan Sadar", "postalCode": "1540", "villagesBn": ["সিরাজদিখান বাজার"], "villagesEn": ["Sirajdikhan Bazar"]}]},
                    {"nameBn": "টংগীবাড়ী", "nameEn": "Tongibari", "unions": [{"nameBn": "টংগীবাড়ী সদর", "nameEn": "Tongibari Sadar", "postalCode": "1520", "villagesBn": ["টংগীবাড়ী বাজার"], "villagesEn": ["Tongibari Bazar"]}]},
                    {"nameBn": "লৌহজং", "nameEn": "Louhajang", "unions": [{"nameBn": "লৌহজং সদর (মাওয়া)", "nameEn": "Louhajang Sadar (Mawa)", "postalCode": "1530", "villagesBn": ["মাওয়া ঘাট এলাকা", "লৌহজং বাজার"], "villagesEn": ["Mawa Ghat Area", "Louhajang Bazar"]}]}
                ]
            },
            {
                "nameBn": "রাজবাড়ী", "nameEn": "Rajbari",
                "upazilas": [
                    {"nameBn": "রাজবাড়ী সদর", "nameEn": "Rajbari Sadar", "unions": [{"nameBn": "রাজবাড়ী পৌরসভা", "nameEn": "Rajbari Municipality", "postalCode": "7700", "villagesBn": ["পৌর বাজার", "স্টেশন রোড"], "villagesEn": ["Poura Bazar", "Station Road"]}]},
                    {"nameBn": "গোয়ালন্দ", "nameEn": "Goalandu", "unions": [{"nameBn": "গোয়ালন্দ পৌরসভা (দৌলতদিয়া)", "nameEn": "Goalandu Municipality (Daulatdia)", "postalCode": "7710", "villagesBn": ["দৌলতদিয়া ঘাট এলাকা", "গোয়ালন্দ বাজার"], "villagesEn": ["Daulatdia Ghat Area", "Goalandu Bazar"]}]},
                    {"nameBn": "পাংশা", "nameEn": "Pangsha", "unions": [{"nameBn": "পাংশা পৌরসভা", "nameEn": "Pangsha Municipality", "postalCode": "7720", "villagesBn": ["পাংশা বাজার"], "villagesEn": ["Pangsha Bazar"]}]},
                    {"nameBn": "বালিয়াকান্দি", "nameEn": "Baliakandi", "unions": [{"nameBn": "বালিয়াকান্দি সদর", "nameEn": "Baliakandi Sadar", "postalCode": "7730", "villagesBn": ["বালিয়াকান্দি বাজার"], "villagesEn": ["Baliakandi Bazar"]}]},
                    {"nameBn": "কালুখালী", "nameEn": "Kalukhali", "unions": [{"nameBn": "কালুখালী সদর", "nameEn": "Kalukhali Sadar", "postalCode": "7721", "villagesBn": ["কালুখালী বাজার"], "villagesEn": ["Kalukhali Bazar"]}]}
                ]
            },
            {
                "nameBn": "শরীয়তপুর", "nameEn": "Shariatpur",
                "upazilas": [
                    {"nameBn": "শরীয়তপুর সদর", "nameEn": "Shariatpur Sadar", "unions": [{"nameBn": "শরীয়তপুর পৌরসভা", "nameEn": "Shariatpur Municipality", "postalCode": "8000", "villagesBn": ["পৌর বাজার", "পালং"], "villagesEn": ["Poura Bazar", "Palong"]}]},
                    {"nameBn": "জাজিরা", "nameEn": "Zajira", "unions": [{"nameBn": "জাজিরা পৌরসভা", "nameEn": "Zajira Municipality", "postalCode": "8010", "villagesBn": ["জাজিরা বাজার", "পদ্মা সেতু জাজিরা পয়েন্ট"], "villagesEn": ["Zajira Bazar", "Padma Bridge Zajira Point"]}]},
                    {"nameBn": "নড়িয়া", "nameEn": "Naria", "unions": [{"nameBn": "নড়িয়া পৌরসভা", "nameEn": "Naria Municipality", "postalCode": "8020", "villagesBn": ["নড়িয়া বাজার", "নড়িয়া নদী তীর"], "villagesEn": ["Naria Bazar", "Naria River Bank"]}]},
                    {"nameBn": "ভেদরগঞ্জ", "nameEn": "Bhedarganj", "unions": [{"nameBn": "ভেদরগঞ্জ পৌরসভা", "nameEn": "Bhedarganj Municipality", "postalCode": "8030", "villagesBn": ["ভেদরগঞ্জ বাজার"], "villagesEn": ["Bhedarganj Bazar"]}]},
                    {"nameBn": "ডামুড্যা", "nameEn": "Damudya", "unions": [{"nameBn": "ডামুড্যা পৌরসভা", "nameEn": "Damudya Municipality", "postalCode": "8040", "villagesBn": ["ডামুড্যা বাজার"], "villagesEn": ["Damudya Bazar"]}]},
                    {"nameBn": "গোসাইরহাট", "nameEn": "Gosairhat", "unions": [{"nameBn": "গোসাইরহাট পৌরসভা", "nameEn": "Gosairhat Municipality", "postalCode": "8050", "villagesBn": ["গোসাইরহাট বাজার"], "villagesEn": ["Gosairhat Bazar"]}]}
                ]
            }
        ]
    }
]

print("Base setup OK")
