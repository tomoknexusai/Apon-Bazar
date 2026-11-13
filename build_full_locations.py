import json

# Python generator to output src/lib/bd-locations.ts

divisions_list = [
    {
        "nameBn": "ঢাকা", "nameEn": "Dhaka",
        "districts": [
            {
                "nameBn": "ঢাকা", "nameEn": "Dhaka",
                "upazilas": [
                    {"nameBn": "ধানমন্ডি", "nameEn": "Dhanmondi", "unions": [{"nameBn": "ধানমন্ডি আ/এ", "nameEn": "Dhanmondi R/A", "postalCode": "1209"}, {"nameBn": "সোবহানবাগ", "nameEn": "Sobhanbagh", "postalCode": "1207"}]},
                    {"nameBn": "গুলশান", "nameEn": "Gulshan", "unions": [{"nameBn": "গুলশান ১", "nameEn": "Gulshan 1", "postalCode": "1212"}, {"nameBn": "গুলশান ২", "nameEn": "Gulshan 2", "postalCode": "1212"}]},
                    {"nameBn": "মিরপুর", "nameEn": "Mirpur", "unions": [{"nameBn": "মিরপুর ১০", "nameEn": "Mirpur 10", "postalCode": "1216"}, {"nameBn": "পল্লবী", "nameEn": "Pallabi", "postalCode": "1216"}]},
                    {"nameBn": "উত্তরা", "nameEn": "Uttara", "unions": [{"nameBn": "উত্তরা মডেল টাউন", "nameEn": "Uttara Model Town", "postalCode": "1230"}]},
                    {"nameBn": "সাভার", "nameEn": "Savar", "unions": [{"nameBn": "সাভার পৌরসভা", "nameEn": "Savar Municipality", "postalCode": "1340"}, {"nameBn": "আমিনবাজার", "nameEn": "Aminbazar", "postalCode": "1348"}, {"nameBn": "আশুলিয়া", "nameEn": "Ashulia", "postalCode": "1341"}]},
                    {"nameBn": "কেরানীগঞ্জ", "nameEn": "Keraniganj", "unions": [{"nameBn": "জিনজিরা", "nameEn": "Zinjira", "postalCode": "1310"}, {"nameBn": "শুভাঢ্যা", "nameEn": "Shubhadya", "postalCode": "1310"}]},
                    {"nameBn": "ধামরাই", "nameEn": "Dhamrai", "unions": [{"nameBn": "ধামরাই পৌরসভা", "nameEn": "Dhamrai Municipality", "postalCode": "1350"}]},
                    {"nameBn": "দোহার", "nameEn": "Dohar", "unions": [{"nameBn": "জয়পাড়া পৌরসভা", "nameEn": "Joypara Municipality", "postalCode": "1330"}]},
                    {"nameBn": "নবাবগঞ্জ", "nameEn": "Nawabganj", "unions": [{"nameBn": "নবাবগঞ্জ সদর", "nameEn": "Nawabganj Sadar", "postalCode": "1320"}]},
                    {"nameBn": "মোহাম্মদপুর", "nameEn": "Mohammadpur", "unions": [{"nameBn": "মোহাম্মদপুর টাউন হল", "nameEn": "Mohammadpur Town Hall", "postalCode": "1207"}]},
                    {"nameBn": "তেজগাঁও", "nameEn": "Tejgaon", "unions": [{"nameBn": "তেজগাঁও শিল্প এলাকা", "nameEn": "Tejgaon I/A", "postalCode": "1208"}]},
                    {"nameBn": "মতিঝিল", "nameEn": "Motijheel", "unions": [{"nameBn": "মতিঝিল সি/এ", "nameEn": "Motijheel C/A", "postalCode": "1000"}]},
                    {"nameBn": "বাড্ডা", "nameEn": "Badda", "unions": [{"nameBn": "উত্তর বাড্ডা", "nameEn": "North Badda", "postalCode": "1212"}]}
                ]
            },
            {
                "nameBn": "গাজীপুর", "nameEn": "Gazipur",
                "upazilas": [
                    {"nameBn": "গাজীপুর সদর", "nameEn": "Gazipur Sadar", "unions": [{"nameBn": "গাজীপুর চৌরাস্তা", "nameEn": "Gazipur Chourasta", "postalCode": "1700"}]},
                    {"nameBn": "কালিয়াকৈর", "nameEn": "Kaliakair", "unions": [{"nameBn": "কালিয়াকৈর পৌরসভা", "nameEn": "Kaliakair Municipality", "postalCode": "1750"}]},
                    {"nameBn": "কালীগঞ্জ", "nameEn": "Kaliganj", "unions": [{"nameBn": "কালীগঞ্জ পৌরসভা", "nameEn": "Kaliganj Municipality", "postalCode": "1720"}]},
                    {"nameBn": "কাপাসিয়া", "nameEn": "Kapasia", "unions": [{"nameBn": "কাপাসিয়া সদর", "nameEn": "Kapasia Sadar", "postalCode": "1730"}]},
                    {"nameBn": "শ্রীপুর", "nameEn": "Sreepur", "unions": [{"nameBn": "শ্রীপুর পৌরসভা", "nameEn": "Sreepur Municipality", "postalCode": "1740"}]},
                    {"nameBn": "টঙ্গী", "nameEn": "Tongi", "unions": [{"nameBn": "টঙ্গী বিসিক", "nameEn": "Tongi BSCIC", "postalCode": "1710"}]}
                ]
            },
            {
                "nameBn": "নারায়ণগঞ্জ", "nameEn": "Narayanganj",
                "upazilas": [
                    {"nameBn": "নারায়ণগঞ্জ সদর", "nameEn": "Narayanganj Sadar", "unions": [{"nameBn": "নারায়ণগঞ্জ সিটি", "nameEn": "Narayanganj City", "postalCode": "1400"}]},
                    {"nameBn": "বন্দর", "nameEn": "Bandar", "unions": [{"nameBn": "বন্দর সদর", "nameEn": "Bandar Sadar", "postalCode": "1410"}]},
                    {"nameBn": "আড়াইহাজার", "nameEn": "Araihazar", "unions": [{"nameBn": "আড়াইহাজার পৌরসভা", "nameEn": "Araihazar Municipality", "postalCode": "1450"}]},
                    {"nameBn": "রূপগঞ্জ", "nameEn": "Rupganj", "unions": [{"nameBn": "রূপগঞ্জ সদর", "nameEn": "Rupganj Sadar", "postalCode": "1460"}]},
                    {"nameBn": "সোনারগাঁ", "nameEn": "Sonargaon", "unions": [{"nameBn": "সোনারগাঁ পৌরসভা", "nameEn": "Sonargaon Municipality", "postalCode": "1440"}]}
                ]
            },
            {
                "nameBn": "নরসিংদী", "nameEn": "Narsingdi",
                "upazilas": [
                    {"nameBn": "নরসিংদী সদর", "nameEn": "Narsingdi Sadar", "unions": [{"nameBn": "নরসিংদী পৌরসভা", "nameEn": "Narsingdi Municipality", "postalCode": "1600"}]},
                    {"nameBn": "বেলাবো", "nameEn": "Belabo", "unions": [{"nameBn": "বেলাবো সদর", "nameEn": "Belabo Sadar", "postalCode": "1640"}]},
                    {"nameBn": "মনোহরদী", "nameEn": "Monohardi", "unions": [{"nameBn": "মনোহরদী পৌরসভা", "nameEn": "Monohardi Municipality", "postalCode": "1650"}]},
                    {"nameBn": "পলাশ", "nameEn": "Palash", "unions": [{"nameBn": "ঘোড়াশাল পৌরসভা", "nameEn": "Ghorashal Municipality", "postalCode": "1610"}]},
                    {"nameBn": "রায়পুরা", "nameEn": "Raipura", "unions": [{"nameBn": "রায়পুরা পৌরসভা", "nameEn": "Raipura Municipality", "postalCode": "1630"}]},
                    {"nameBn": "শিবপুর", "nameEn": "Shibpur", "unions": [{"nameBn": "শিবপুর সদর", "nameEn": "Shibpur Sadar", "postalCode": "1620"}]}
                ]
            },
            {
                "nameBn": "টাঙ্গাইল", "nameEn": "Tangail",
                "upazilas": [
                    {"nameBn": "টাঙ্গাইল সদর", "nameEn": "Tangail Sadar", "unions": [{"nameBn": "টাঙ্গাইল পৌরসভা", "nameEn": "Tangail Municipality", "postalCode": "1900"}]},
                    {"nameBn": "মির্জাপুর", "nameEn": "Mirzapur", "unions": [{"nameBn": "মির্জাপুর পৌরসভা", "nameEn": "Mirzapur Municipality", "postalCode": "1940"}]},
                    {"nameBn": "মধুপুর", "nameEn": "Madhupur", "unions": [{"nameBn": "মধুপুর পৌরসভা", "nameEn": "Madhupur Municipality", "postalCode": "1996"}]},
                    {"nameBn": "ঘাটাইল", "nameEn": "Ghatail", "unions": [{"nameBn": "ঘাটাইল পৌরসভা", "nameEn": "Ghatail Municipality", "postalCode": "1980"}]},
                    {"nameBn": "কালিহাতী", "nameEn": "Kalihati", "unions": [{"nameBn": "কালিহাতী পৌরসভা", "nameEn": "Kalihati Municipality", "postalCode": "1970"}]},
                    {"nameBn": "গোপালপুর", "nameEn": "Gopalpur", "unions": [{"nameBn": "গোপালপুর পৌরসভা", "nameEn": "Gopalpur Municipality", "postalCode": "1990"}]},
                    {"nameBn": "সখিপুর", "nameEn": "Sakhipur", "unions": [{"nameBn": "সখিপুর পৌরসভা", "nameEn": "Sakhipur Municipality", "postalCode": "1950"}]},
                    {"nameBn": "বাসাইল", "nameEn": "Basail", "unions": [{"nameBn": "বাসাইল সদর", "nameEn": "Basail Sadar", "postalCode": "1920"}]},
                    {"nameBn": "ভূঞাপুর", "nameEn": "Bhuapur", "unions": [{"nameBn": "ভূঞাপুর পৌরসভা", "nameEn": "Bhuapur Municipality", "postalCode": "1960"}]},
                    {"nameBn": "দেলদুয়ার", "nameEn": "Delduar", "unions": [{"nameBn": "দেলদুয়ার সদর", "nameEn": "Delduar Sadar", "postalCode": "1910"}]},
                    {"nameBn": "ধনবাড়ী", "nameEn": "Dhanbari", "unions": [{"nameBn": "ধনবাড়ী পৌরসভা", "nameEn": "Dhanbari Municipality", "postalCode": "1997"}]},
                    {"nameBn": "নাগরপুর", "nameEn": "Nagarpur", "unions": [{"nameBn": "নাগরপুর সদর", "nameEn": "Nagarpur Sadar", "postalCode": "1930"}]}
                ]
            },
            {
                "nameBn": "ফরিদপুর", "nameEn": "Faridpur",
                "upazilas": [
                    {"nameBn": "ফরিদপুর সদর", "nameEn": "Faridpur Sadar", "unions": [{"nameBn": "ফরিদপুর পৌরসভা", "nameEn": "Faridpur Municipality", "postalCode": "7800"}]},
                    {"nameBn": "ভাঙ্গা", "nameEn": "Bhanga", "unions": [{"nameBn": "ভাঙ্গা পৌরসভা", "nameEn": "Bhanga Municipality", "postalCode": "7830"}]},
                    {"nameBn": "বোয়ালমারী", "nameEn": "Boalmari", "unions": [{"nameBn": "বোয়ালমারী পৌরসভা", "nameEn": "Boalmari Municipality", "postalCode": "7860"}]},
                    {"nameBn": "আলফাডাঙ্গা", "nameEn": "Alfadanga", "unions": [{"nameBn": "আলফাডাঙ্গা সদর", "nameEn": "Alfadanga Sadar", "postalCode": "7870"}]},
                    {"nameBn": "চরভদ্রাসন", "nameEn": "Charbhadrasan", "unions": [{"nameBn": "চরভদ্রাসন সদর", "nameEn": "Charbhadrasan Sadar", "postalCode": "7840"}]},
                    {"nameBn": "মধুখালী", "nameEn": "Madhukhali", "unions": [{"nameBn": "মধুখালী পৌরসভা", "nameEn": "Madhukhali Municipality", "postalCode": "7850"}]},
                    {"nameBn": "নগরকান্দা", "nameEn": "Nagarkanda", "unions": [{"nameBn": "নগরকান্দা পৌরসভা", "nameEn": "Nagarkanda Municipality", "postalCode": "7810"}]},
                    {"nameBn": "সদরপুর", "nameEn": "Sadarpur", "unions": [{"nameBn": "সদরপুর সদর", "nameEn": "Sadarpur Sadar", "postalCode": "7820"}]},
                    {"nameBn": "সালথা", "nameEn": "Saltha", "unions": [{"nameBn": "সালথা সদর", "nameEn": "Saltha Sadar", "postalCode": "7811"}]}
                ]
            },
            {
                "nameBn": "গোপালগঞ্জ", "nameEn": "Gopalganj",
                "upazilas": [
                    {"nameBn": "গোপালগঞ্জ সদর", "nameEn": "Gopalganj Sadar", "unions": [{"nameBn": "গোপালগঞ্জ পৌরসভা", "nameEn": "Gopalganj Municipality", "postalCode": "8100"}]},
                    {"nameBn": "টুঙ্গিপাড়া", "nameEn": "Tungipara", "unions": [{"nameBn": "টুঙ্গিপাড়া পৌরসভা", "nameEn": "Tungipara Municipality", "postalCode": "8120"}]},
                    {"nameBn": "কাশিয়ানী", "nameEn": "Kashiani", "unions": [{"nameBn": "কাশিয়ানী সদর", "nameEn": "Kashiani Sadar", "postalCode": "8130"}]},
                    {"nameBn": "কোটালীপাড়া", "nameEn": "Kotalipara", "unions": [{"nameBn": "কোটালীপাড়া পৌরসভা", "nameEn": "Kotalipara Municipality", "postalCode": "8110"}]},
                    {"nameBn": "মুকসুদপুর", "nameEn": "Muksudpur", "unions": [{"nameBn": "মুকসুদপুর পৌরসভা", "nameEn": "Muksudpur Municipality", "postalCode": "8140"}]}
                ]
            },
            {
                "nameBn": "কিশোরগঞ্জ", "nameEn": "Kishoreganj",
                "upazilas": [
                    {"nameBn": "কিশোরগঞ্জ সদর", "nameEn": "Kishoreganj Sadar", "unions": [{"nameBn": "কিশোরগঞ্জ পৌরসভা", "nameEn": "Kishoreganj Municipality", "postalCode": "2300"}]},
                    {"nameBn": "ভৈরব", "nameEn": "Bhairab", "unions": [{"nameBn": "ভৈরব পৌরসভা", "nameEn": "Bhairab Municipality", "postalCode": "2350"}]},
                    {"nameBn": "বাজিতপুর", "nameEn": "Bajitpur", "unions": [{"nameBn": "বাজিতপুর পৌরসভা", "nameEn": "Bajitpur Municipality", "postalCode": "2330"}]},
                    {"nameBn": "হোসেনপুর", "nameEn": "Hossenpur", "unions": [{"nameBn": "হোসেনপুর পৌরসভা", "nameEn": "Hossenpur Municipality", "postalCode": "2320"}]},
                    {"nameBn": "ইটনা", "nameEn": "Itna", "unions": [{"nameBn": "ইটনা সদর", "nameEn": "Itna Sadar", "postalCode": "2390"}]},
                    {"nameBn": "করিমগঞ্জ", "nameEn": "Karimganj", "unions": [{"nameBn": "করিমগঞ্জ পৌরসভা", "nameEn": "Karimganj Municipality", "postalCode": "2310"}]},
                    {"nameBn": "কটিয়াদী", "nameEn": "Katiadi", "unions": [{"nameBn": "কটিয়াদী পৌরসভা", "nameEn": "Katiadi Municipality", "postalCode": "2340"}]},
                    {"nameBn": "কুলিয়ারচর", "nameEn": "Kuliarchar", "unions": [{"nameBn": "কুলিয়ারচর পৌরসভা", "nameEn": "Kuliarchar Municipality", "postalCode": "2360"}]},
                    {"nameBn": "মিঠামইন", "nameEn": "Mithamain", "unions": [{"nameBn": "মিঠামইন সদর", "nameEn": "Mithamain Sadar", "postalCode": "2370"}]},
                    {"nameBn": "নিকলী", "nameEn": "Nikli", "unions": [{"nameBn": "নিকলী সদর", "nameEn": "Nikli Sadar", "postalCode": "2380"}]},
                    {"nameBn": "পাকুন্দিয়া", "nameEn": "Pakundia", "unions": [{"nameBn": "পাকুন্দিয়া পৌরসভা", "nameEn": "Pakundia Municipality", "postalCode": "2326"}]},
                    {"nameBn": "তাড়াইল", "nameEn": "Tarail", "unions": [{"nameBn": "তাড়াইল সদর", "nameEn": "Tarail Sadar", "postalCode": "2316"}]},
                    {"nameBn": "অষ্টগ্রাম", "nameEn": "Austagram", "unions": [{"nameBn": "অষ্টগ্রাম সদর", "nameEn": "Austagram Sadar", "postalCode": "2376"}]}
                ]
            },
            {
                "nameBn": "মাদারীপুর", "nameEn": "Madaripur",
                "upazilas": [
                    {"nameBn": "মাদারীপুর সদর", "nameEn": "Madaripur Sadar", "unions": [{"nameBn": "মাদারীপুর পৌরসভা", "nameEn": "Madaripur Municipality", "postalCode": "7900"}]},
                    {"nameBn": "শিবচর", "nameEn": "Shivchar", "unions": [{"nameBn": "শিবচর পৌরসভা", "nameEn": "Shivchar Municipality", "postalCode": "7930"}]},
                    {"nameBn": "কালকিনি", "nameEn": "Kalkini", "unions": [{"nameBn": "কালকিনি পৌরসভা", "nameEn": "Kalkini Municipality", "postalCode": "7910"}]},
                    {"nameBn": "রাজৈর", "nameEn": "Rajoir", "unions": [{"nameBn": "রাজৈর পৌরসভা", "nameEn": "Rajoir Municipality", "postalCode": "7920"}]},
                    {"nameBn": "ডাসার", "nameEn": "Dasar", "unions": [{"nameBn": "ডাসার সদর", "nameEn": "Dasar Sadar", "postalCode": "7911"}]}
                ]
            },
            {
                "nameBn": "মানিকগঞ্জ", "nameEn": "Manikganj",
                "upazilas": [
                    {"nameBn": "মানিকগঞ্জ সদর", "nameEn": "Manikganj Sadar", "unions": [{"nameBn": "মানিকগঞ্জ পৌরসভা", "nameEn": "Manikganj Municipality", "postalCode": "1800"}]},
                    {"nameBn": "সিংগাইর", "nameEn": "Singair", "unions": [{"nameBn": "সিংগাইর পৌরসভা", "nameEn": "Singair Municipality", "postalCode": "1820"}]},
                    {"nameBn": "শিবালয়", "nameEn": "Shibalaya", "unions": [{"nameBn": "শিবালয় সদর", "nameEn": "Shibalaya Sadar", "postalCode": "1850"}]},
                    {"nameBn": "সাটুরিয়া", "nameEn": "Saturia", "unions": [{"nameBn": "সাটুরিয়া সদর", "nameEn": "Saturia Sadar", "postalCode": "1810"}]},
                    {"nameBn": "ঘিওর", "nameEn": "Ghior", "unions": [{"nameBn": "ঘিওর সদর", "nameEn": "Ghior Sadar", "postalCode": "1840"}]},
                    {"nameBn": "দৌলতপুর", "nameEn": "Daulatpur", "unions": [{"nameBn": "দৌলতপুর সদর", "nameEn": "Daulatpur Sadar", "postalCode": "1830"}]},
                    {"nameBn": "হরিরামপুর", "nameEn": "Harirampur", "unions": [{"nameBn": "হরিরামপুর সদর", "nameEn": "Harirampur Sadar", "postalCode": "1860"}]}
                ]
            },
            {
                "nameBn": "মুন্সীগঞ্জ", "nameEn": "Munshiganj",
                "upazilas": [
                    {"nameBn": "মুন্সীগঞ্জ সদর", "nameEn": "Munshiganj Sadar", "unions": [{"nameBn": "মুন্সীগঞ্জ পৌরসভা", "nameEn": "Munshiganj Municipality", "postalCode": "1500"}]},
                    {"nameBn": "গজারিয়া", "nameEn": "Gazaria", "unions": [{"nameBn": "গজারিয়া সদর", "nameEn": "Gazaria Sadar", "postalCode": "1510"}]},
                    {"nameBn": "শ্রীনগর", "nameEn": "Sreenagar", "unions": [{"nameBn": "শ্রীনগর পৌরসভা", "nameEn": "Sreenagar Municipality", "postalCode": "1550"}]},
                    {"nameBn": "সিরাজদিখান", "nameEn": "Sirajdikhan", "unions": [{"nameBn": "সিরাজদিখান সদর", "nameEn": "Sirajdikhan Sadar", "postalCode": "1540"}]},
                    {"nameBn": "টংগীবাড়ী", "nameEn": "Tongibari", "unions": [{"nameBn": "টংগীবাড়ী সদর", "nameEn": "Tongibari Sadar", "postalCode": "1520"}]},
                    {"nameBn": "লৌহজং", "nameEn": "Louhajang", "unions": [{"nameBn": "লৌহজং সদর (মাওয়া)", "nameEn": "Louhajang Sadar (Mawa)", "postalCode": "1530"}]}
                ]
            },
            {
                "nameBn": "রাজবাড়ী", "nameEn": "Rajbari",
                "upazilas": [
                    {"nameBn": "রাজবাড়ী সদর", "nameEn": "Rajbari Sadar", "unions": [{"nameBn": "রাজবাড়ী পৌরসভা", "nameEn": "Rajbari Municipality", "postalCode": "7700"}]},
                    {"nameBn": "গোয়ালন্দ", "nameEn": "Goalandu", "unions": [{"nameBn": "গোয়ালন্দ পৌরসভা", "nameEn": "Goalandu Municipality", "postalCode": "7710"}]},
                    {"nameBn": "পাংশা", "nameEn": "Pangsha", "unions": [{"nameBn": "পাংশা পৌরসভা", "nameEn": "Pangsha Municipality", "postalCode": "7720"}]},
                    {"nameBn": "বালিয়াকান্দি", "nameEn": "Baliakandi", "unions": [{"nameBn": "বালিয়াকান্দি সদর", "nameEn": "Baliakandi Sadar", "postalCode": "7730"}]},
                    {"nameBn": "কালুখালী", "nameEn": "Kalukhali", "unions": [{"nameBn": "কালুখালী সদর", "nameEn": "Kalukhali Sadar", "postalCode": "7721"}]}
                ]
            },
            {
                "nameBn": "শরীয়তপুর", "nameEn": "Shariatpur",
                "upazilas": [
                    {"nameBn": "শরীয়তপুর সদর", "nameEn": "Shariatpur Sadar", "unions": [{"nameBn": "শরীয়তপুর পৌরসভা", "nameEn": "Shariatpur Municipality", "postalCode": "8000"}]},
                    {"nameBn": "জাজিরা", "nameEn": "Zajira", "unions": [{"nameBn": "জাজিরা পৌরসভা", "nameEn": "Zajira Municipality", "postalCode": "8010"}]},
                    {"nameBn": "নড়িয়া", "nameEn": "Naria", "unions": [{"nameBn": "নড়িয়া পৌরসভা", "nameEn": "Naria Municipality", "postalCode": "8020"}]},
                    {"nameBn": "ভেদরগঞ্জ", "nameEn": "Bhedarganj", "unions": [{"nameBn": "ভেদরগঞ্জ পৌরসভা", "nameEn": "Bhedarganj Municipality", "postalCode": "8030"}]},
                    {"nameBn": "ডামুড্যা", "nameEn": "Damudya", "unions": [{"nameBn": "ডামুড্যা পৌরসভা", "nameEn": "Damudya Municipality", "postalCode": "8040"}]},
                    {"nameBn": "গোসাইরহাট", "nameEn": "Gosairhat", "unions": [{"nameBn": "গোসাইরহাট পৌরসভা", "nameEn": "Gosairhat Municipality", "postalCode": "8050"}]}
                ]
            }
        ]
    }
]

print("Script template written")
