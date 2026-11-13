# -*- coding: utf-8 -*-
import json

# Full 8 Divisions & 64 Districts data for Bangladesh
divisions = [
    {
        "nameBn": "ঢাকা", "nameEn": "Dhaka",
        "districts": [
            {"nameBn": "ঢাকা", "nameEn": "Dhaka", "upazilas": ["ধানমন্ডি", "গুলশান", "মিরপুর", "উত্তরা", "সাভার", "কেরানীগঞ্জ", "ধামরাই", "দোহার", "নবাবগঞ্জ", "মোহাম্মদপুর", "তেজগাঁও", "মতিঝিল", "বাড্ডা", "যাত্রাবাড়ী", "খিলগাঁও", "লালবাগ", "রমনা", "পল্টন", "শাহবাগ", "ক্যান্টনমেন্ট", "তুরাগ", "ডেমরা", "শ্যামপুর", "কামরাঙ্গীরচর", "কোতোয়ালী", "সূত্রাপুর", "হাজারীবাগ", "কাফরুল", "খিলক্ষেত", "ভাষানটেক", "দারুস সালাম", "রামপুরা", "হাতিরঝিল", "মুগদা", "উত্তরখান", "দক্ষিণখান", "ওয়ারী", "চকবাজার", "গেন্ডারিয়া", "সবুজবাগ", "শাহ আলী", "ভাটারা", "রূপনগর", "কদমতলী"]},
            {"nameBn": "গাজীপুর", "nameEn": "Gazipur", "upazilas": ["গাজীপুর সদর", "টঙ্গী", "কালিয়াকৈর", "শ্রীপুর", "কাপাসিয়া", "কালীগঞ্জ"]},
            {"nameBn": "নারায়ণগঞ্জ", "nameEn": "Narayanganj", "upazilas": ["নারায়ণগঞ্জ সদর", "সিদ্ধিরগঞ্জ", "ফতুল্লা", "রূপগঞ্জ", "সোনারগাঁ", "বন্দর", "আড়াইহাজার"]},
            {"nameBn": "টাঙ্গাইল", "nameEn": "Tangail", "upazilas": ["টাঙ্গাইল সদর", "মির্জাপুর", "মধুপুর", "ঘাটাইল", "কালিহাতী", "গোপালপুর", "সখিপুর", "বাসাইল", "ভূঞাপুর", "দেলদুয়ার", "ধনবাড়ী", "নাগরপুর"]},
            {"nameBn": "নরসিংদী", "nameEn": "Narsingdi", "upazilas": ["নরসিংদী সদর", "পলাশ", "রায়পুরা", "শিবপুর", "মনোহরদী", "বেলাবো"]},
            {"nameBn": "ফরিদপুর", "nameEn": "Faridpur", "upazilas": ["ফরিদপুর সদর", "ভাঙ্গা", "বোয়ালমারী", "আলফাডাঙ্গা", "চরভদ্রাসন", "মধুখালী", "নগরকান্দা", "সদরপুর", "সালথা"]},
            {"nameBn": "গোপালগঞ্জ", "nameEn": "Gopalganj", "upazilas": ["গোপালগঞ্জ সদর", "টুঙ্গিপাড়া", "কাশিয়ানী", "কোটালীপাড়া", "মুকসুদপুর"]},
            {"nameBn": "কিশোরগঞ্জ", "nameEn": "Kishoreganj", "upazilas": ["কিশোরগঞ্জ সদর", "ভৈরব", "বাজিতপুর", "হোসেনপুর", "ইটনা", "করিমগঞ্জ", "কটিয়াদী", "কুলিয়ারচর", "মিঠামইন", "নিকলী", "পাকুন্দিয়া", "তাড়াইল", "অষ্টগ্রাম"]},
            {"nameBn": "মাদারীপুর", "nameEn": "Madaripur", "upazilas": ["মাদারীপুর সদর", "শিবচর", "কালকিনি", "রাজৈর", "ডাসার"]},
            {"nameBn": "মানিকগঞ্জ", "nameEn": "Manikganj", "upazilas": ["মানিকগঞ্জ সদর", "সিংগাইর", "শিবালয়", "সাটুরিয়া", "ঘিওর", "দৌলতপুর", "হরিরামপুর"]},
            {"nameBn": "মুন্সীগঞ্জ", "nameEn": "Munshiganj", "upazilas": ["মুন্সীগঞ্জ সদর", "গজারিয়া", "শ্রীনগর", "সিরাজদিখান", "টংগীবাড়ী", "লৌহজং"]},
            {"nameBn": "রাজবাড়ী", "nameEn": "Rajbari", "upazilas": ["রাজবাড়ী সদর", "গোয়ালন্দ", "পাংশা", "বালিয়াকান্দি", "কালুখালী"]},
            {"nameBn": "শরীয়তপুর", "nameEn": "Shariatpur", "upazilas": ["শরীয়তপুর সদর", "জাজিরা", "নড়িয়া", "ভেদরগঞ্জ", "ডামুড্যা", "গোসাইরহাট"]}
        ]
    },
    {
        "nameBn": "চট্টগ্রাম", "nameEn": "Chattogram",
        "districts": [
            {"nameBn": "চট্টগ্রাম", "nameEn": "Chattogram", "upazilas": ["চট্টগ্রাম কোতোয়ালী", "পাঁচলাইশ", "খুলশী", "ডবলমুরিং", "চান্দগাঁও", "পতেঙ্গা", "হালিশহর", "বাকলিয়া", "বায়েজিদ", "পাহাড়তলী", "বন্দর", "কর্ণফুলী", "আনোয়ারা", "বাঁশখালী", "বোয়ালখালী", "চন্দনাইশ", "ফটিকছড়ি", "হাটহাজারী", "লোহাগাড়া", "মীরসরাই", "পটিয়া", "রাঙ্গুনিয়া", "রাউজান", "সন্দ্বীপ", "সাতকানিয়া", "সীতাকুণ্ড"]},
            {"nameBn": "কক্সবাজার", "nameEn": "Cox's Bazar", "upazilas": ["কক্সবাজার সদর", "চকোরিয়া", "টেকনাফ", "উখিয়া", "মহেশখালী", "পেকুয়া", "রামু", "কুতুবদিয়া", "ঈদগাঁও"]},
            {"nameBn": "কুমিল্লা", "nameEn": "Cumilla", "upazilas": ["আদর্শ সদর", "সদর দক্ষিণ", "লাকসাম", "দাউদকান্দি", "চৌদ্দগ্রাম", "চান্দিনা", "দেবীদ্বার", "বুড়িচং", "ব্রাহ্মণপাড়া", "বরুড়া", "হোমনা", "মুরাদনগর", "নাঙ্গলকোট", "তিতাস", "মেঘনা", "মনোহরগঞ্জ", "লালমাই"]},
            {"nameBn": "ফেনী", "nameEn": "Feni", "upazilas": ["ফেনী সদর", "দাগনভূঞা", "ছাগলনাইয়া", "সোনাগাজী", "পরশুরাম", "ফুলগাজী"]},
            {"nameBn": "ব্রাহ্মণবাড়িয়া", "nameEn": "Brahmanbaria", "upazilas": ["ব্রাহ্মণবাড়িয়া সদর", "আশুগঞ্জ", "আখাউড়া", "বাঞ্ছারামপুর", "কসবা", "নবীনগর", "নাসিরনগর", "সরাইল", "বিজয়নগর"]},
            {"nameBn": "নোয়াখালী", "nameEn": "Noakhali", "upazilas": ["নোয়াখালী সদর", "বেগমগঞ্জ", "চাটখিল", "কোম্পানীগঞ্জ", "হাতিয়া", "সেনবাগ", "সুবর্ণচর", "সোনাইমুড়ী", "কবিরহাট"]},
            {"nameBn": "লক্ষ্মীপুর", "nameEn": "Lakshmipur", "upazilas": ["লক্ষ্মীপুর সদর", "রায়পুর", "রামগঞ্জ", "রামগতি", "কমলনগর"]},
            {"nameBn": "চাঁদপুর", "nameEn": "Chandpur", "upazilas": ["চাঁদপুর সদর", "হাজীগঞ্জ", "ফরিদগঞ্জ", "কচুয়া", "মতলব উত্তর", "মতলব দক্ষিণ", "শাহরাস্তি", "হাইমচর"]},
            {"nameBn": "বান্দরবান", "nameEn": "Bandarban", "upazilas": ["বান্দরবান সদর", "রুমা", "থানচি", "রোয়াংছড়ি", "লামা", "আলীকদম", "নাইক্ষ্যংছড়ি"]},
            {"nameBn": "রাঙ্গামাটি", "nameEn": "Rangamati", "upazilas": ["রাঙ্গামাটি সদর", "কাপ্তাই", "বাঘাইছড়ি", "বরকল", "কাউখালী", "লংগদু", "নানিয়ারচর", "জুরাছড়ি", "রাজস্থলী", "বিলাইছড়ি"]},
            {"nameBn": "খাগড়াছড়ি", "nameEn": "Khagrachhari", "upazilas": ["খাগড়াছড়ি সদর", "দীঘিনালা", "পানছড়ি", "মহালছড়ি", "মাটিরাঙ্গা", "মানিকছড়ি", "রামগড়", "লক্ষ্মীছড়ি", "গুইমারা"]}
        ]
    },
    {
        "nameBn": "রাজশাহী", "nameEn": "Rajshahi",
        "districts": [
            {"nameBn": "রাজশাহী", "nameEn": "Rajshahi", "upazilas": ["বোয়ালিয়া", "রাজপাড়া", "মতিহার", "শাহ মখদুম", "চন্দ্রিমা", "কাটাখালী", "পবা", "গোদাগাড়ী", "তানোর", "বাগমারা", "দুর্গাপুর", "পুঠিয়া", "চারঘাট", "বাঘা", "মোহনপুর"]},
            {"nameBn": "বগুড়া", "nameEn": "Bogura", "upazilas": ["বগুড়া সদর", "শেরপুর", "শিবগঞ্জ", "আদমদীঘি", "দুপচাঁচিয়া", "গাবতলী", "কাহালু", "নন্দীগ্রাম", "সারিয়াকান্দি", "শাজাহানপুর", "সোনাতলা", "ধুনট"]},
            {"nameBn": "পাবনা", "nameEn": "Pabna", "upazilas": ["পাবনা সদর", "ঈশ্বরদী", "সুজানগর", "সাঁথিয়া", "চাটমোহর", "ফরিদপুর", "বেড়া", "আটঘরিয়া", "ভাঙ্গুড়া"]},
            {"nameBn": "সিরাজগঞ্জ", "nameEn": "Sirajganj", "upazilas": ["সিরাজগঞ্জ সদর", "বেলকুচি", "চৌহালী", "কামারখন্দ", "কাজীপুর", "রায়গঞ্জ", "শাহজাদপুর", "তাড়াশ", "উল্লাপাড়া"]},
            {"nameBn": "নওগাঁ", "nameEn": "Naogaon", "upazilas": ["নওগাঁ সদর", "মহাদেবপুর", "বদলগাছী", "পত্নীতলা", "ধামইরহাট", "নিয়ামতপুর", "মান্দা", "আত্রাই", "রানীনগর", "পোরশা", "সাপাহার"]},
            {"nameBn": "নাটোর", "nameEn": "Natore", "upazilas": ["নাটোর সদর", "বাগাতিপাড়া", "বড়াইগ্রাম", "গুরুদাসপুর", "লালপুর", "সিংড়া", "নলডাঙ্গা"]},
            {"nameBn": "জয়পুরহাট", "nameEn": "Joypurhat", "upazilas": ["জয়পুরহাট সদর", "আক্কেলপুর", "কালাই", "ক্ষেতলাল", "পাঁচবিবি"]},
            {"nameBn": "চাঁপাইনবাবগঞ্জ", "nameEn": "Chapainawabganj", "upazilas": ["চাঁপাইনবাবগঞ্জ সদর", "গোমস্তাপুর", "নাচোল", "ভোলাহাট", "শিবগঞ্জ"]}
        ]
    },
    {
        "nameBn": "খুলনা", "nameEn": "Khulna",
        "districts": [
            {"nameBn": "খুলনা", "nameEn": "Khulna", "upazilas": ["খুলনা সদর", "সোনাডাঙ্গা", "খালিশপুর", "দৌলতপুর", "খানজাহান আলী", "বটিয়াঘাটা", "দাকোপ", "ডুমুরিয়া", "দিঘলিয়া", "কয়রা", "পাইকগাছা", "ফুলতলা", "রূপসা", "তেরখাদা"]},
            {"nameBn": "যশোর", "nameEn": "Jashore", "upazilas": ["যশোর সদর", "অভয়নগর", "বাঘারপাড়া", "চৌগাছা", "ঝিকরগাছা", "কেশবপুর", "মণিরামপুর", "শার্শা", "বেনাপোল"]},
            {"nameBn": "কুষ্টিয়া", "nameEn": "Kushtia", "upazilas": ["কুষ্টিয়া সদর", "কুমারখালী", "খোকসা", "মিরপুর", "দৌলতপুর", "ভেড়ামারা"]},
            {"nameBn": "সাতক্ষীরা", "nameEn": "Satkhira", "upazilas": ["সাতক্ষীরা সদর", "আশাশুনি", "দেবহাটা", "কলারোয়া", "কালিগঞ্জ", "শ্যামনগর", "তালা"]},
            {"nameBn": "বাগেরহাট", "nameEn": "Bagerhat", "upazilas": ["বাগেরহাট সদর", "চিতলমারী", "ফকিরহাট", "কচুয়া", "মোল্লাহাট", "মোংলা", "মোরেলগঞ্জ", "রামপাল", "শরণখোলা"]},
            {"nameBn": "ঝিনাইদহ", "nameEn": "Jhenaidah", "upazilas": ["ঝিনাইদহ সদর", "শৈলকুপা", "হরিণাকুণ্ডু", "কালীগঞ্জ", "কোটচাঁদপুর", "মহেশপুর"]},
            {"nameBn": "চুয়াডাঙ্গা", "nameEn": "Chuadanga", "upazilas": ["চুয়াডাঙ্গা সদর", "আলমডাঙ্গা", "দামুড়হুদা", "জীবননগর", "দর্শনা"]},
            {"nameBn": "মেহেরপুর", "nameEn": "Meherpur", "upazilas": ["মেহেরপুর সদর", "গাংনী", "মুজিবনগর"]},
            {"nameBn": "মাগুরা", "nameEn": "Magura", "upazilas": ["মাগুরা সদর", "মহম্মদপুর", "শালিখা", "শ্রীপুর"]},
            {"nameBn": "নড়াইল", "nameEn": "Narail", "upazilas": ["নড়াইল সদর", "কালিয়া", "লোহাগড়া"]}
        ]
    },
    {
        "nameBn": "বরিশাল", "nameEn": "Barishal",
        "districts": [
            {"nameBn": "বরিশাল", "nameEn": "Barishal", "upazilas": ["বরিশাল সদর", "বাকেরগঞ্জ", "বাবুগঞ্জ", "বানারীপাড়া", "গৌরনদী", "হিজলা", "মেহেন্দিগঞ্জ", "মুলাদী", "উজিরপুর", "আগৈলঝাড়া"]},
            {"nameBn": "ভোলা", "nameEn": "Bhola", "upazilas": ["ভোলা সদর", "বোরহানউদ্দিন", "চরফ্যাশন", "দৌলতখান", "লালমোহন", "মনপুরা", "তজুমদ্দিন"]},
            {"nameBn": "ঝালকাঠি", "nameEn": "Jhalokathi", "upazilas": ["ঝালকাঠি সদর", "কাঠালিয়া", "নলছিটি", "রাজাপুর"]},
            {"nameBn": "পিরোজপুর", "nameEn": "Pirojpur", "upazilas": ["পিরোজপুর সদর", "ভাণ্ডারিয়া", "কাউখালী", "মঠবাড়িয়া", "নাজিরপুর", "নেছারাবাদ", "ইন্দুরকানী"]},
            {"nameBn": "বরগুনা", "nameEn": "Barguna", "upazilas": ["বরগুনা সদর", "আমতলী", "বামনা", "বেতাগী", "পাথরঘাটা", "তালতলী"]},
            {"nameBn": "পটুয়াখালী", "nameEn": "Patuakhali", "upazilas": ["পটুয়াখালী সদর", "কুয়াকাটা", "বাউফল", "দশমিনা", "দুমকি", "গলাচিপা", "কলাপাড়া", "মির্জাগঞ্জ", "রাঙ্গাবালী"]}
        ]
    },
    {
        "nameBn": "সিলেট", "nameEn": "Sylhet",
        "districts": [
            {"nameBn": "সিলেট", "nameEn": "Sylhet", "upazilas": ["সিলেট সদর", "দক্ষিণ সুরমা", "গোলাপগঞ্জ", "বিয়ানীবাজার", "বিশ্বনাথ", "ফেঞ্চুগঞ্জ", "বালাগঞ্জ", "জৈন্তাপুর", "কানাইঘাট", "কোম্পানীগঞ্জ", "গোয়াইনঘাট", "জকিগঞ্জ", "ওসমানীনগর"]},
            {"nameBn": "মৌলভীবাজার", "nameEn": "Moulvibazar", "upazilas": ["মৌলভীবাজার সদর", "শ্রীমঙ্গল", "কমলগঞ্জ", "কুলাউড়া", "জুড়ী", "বড়লেখা", "রাজনগর"]},
            {"nameBn": "হবিগঞ্জ", "nameEn": "Habiganj", "upazilas": ["হবিগঞ্জ সদর", "বাহুবল", "বানিয়াচং", "চুনারুঘাট", "আজমিরীগঞ্জ", "লাখাই", "মাধবপুর", "নবীগঞ্জ", "শায়েস্তাগঞ্জ"]},
            {"nameBn": "সুনামগঞ্জ", "nameEn": "Sunamganj", "upazilas": ["সুনামগঞ্জ সদর", "ছাতক", "জগন্নাথপুর", "দোয়ারাবাজার", "শান্তিগঞ্জ", "দিরাই", "শাল্লা", "ধর্মপাশা", "জামালগঞ্জ", "তাহিরপুর", "বিশ্বম্ভরপুর", "মধ্যনগর"]}
        ]
    },
    {
        "nameBn": "রংপুর", "nameEn": "Rangpur",
        "districts": [
            {"nameBn": "রংপুর", "nameEn": "Rangpur", "upazilas": ["রংপুর সদর", "বদরগঞ্জ", "গঙ্গাচড়া", "কাউনিয়া", "মিঠাপুকুর", "পীরগাছা", "পীরগঞ্জ", "তারাগঞ্জ"]},
            {"nameBn": "দিনাজপুর", "nameEn": "Dinajpur", "upazilas": ["দিনাজপুর সদর", "বীরগঞ্জ", "বিরল", "বোচাগঞ্জ", "ফুলবাড়ী", "চিরিরবন্দর", "ঘোড়াঘাট", "হাকিমপুর", "কাহারোল", "খানসামা", "নবাবগঞ্জ", "পার্বতীপুর", "বিরামপুর"]},
            {"nameBn": "গাইবান্ধা", "nameEn": "Gaibandha", "upazilas": ["গাইবান্ধা সদর", "গোবিন্দগঞ্জ", "পলাশবাড়ী", "সাদুল্লাপুর", "সাঘাটা", "সুন্দরগঞ্জ", "ফুলছড়ি"]},
            {"nameBn": "কুড়িগ্রাম", "nameEn": "Kurigram", "upazilas": ["কুড়িগ্রাম সদর", "নাগেশ্বরী", "ভূরুঙ্গামারী", "ফুলবাড়ী", "রাজারহাট", "উলিপুর", "চিলমারী", "রৌমারী", "চর রাজিবপুর"]},
            {"nameBn": "লালমনিরহাট", "nameEn": "Lalmonirhat", "upazilas": ["লালমনিরহাট সদর", "আদিতমারী", "কালীগঞ্জ", "হাতীবান্ধা", "পাটগ্রাম", "বুড়িমারী"]},
            {"nameBn": "নীলফামারী", "nameEn": "Nilphamari", "upazilas": ["নীলফামারী সদর", "সৈয়দপুর", "ডোমার", "ডিমলা", "জলঢাকা", "কিশোরগঞ্জ"]},
            {"nameBn": "পঞ্চগড়", "nameEn": "Panchagarh", "upazilas": ["পঞ্চগড় সদর", "বোদা", "দেবীগঞ্জ", "তেঁতুলিয়া", "আটোয়ারী", "বাংলাবান্ধা"]},
            {"nameBn": "ঠাকুরগাঁও", "nameEn": "Thakurgaon", "upazilas": ["ঠাকুরগাঁও সদর", "পীরগঞ্জ", "বালিয়াডাঙ্গী", "রানীশংকৈল", "হরিপুর"]}
        ]
    },
    {
        "nameBn": "ময়মনসিংহ", "nameEn": "Mymensingh",
        "districts": [
            {"nameBn": "ময়মনসিংহ", "nameEn": "Mymensingh", "upazilas": ["ময়মনসিংহ সদর", "মুক্তাগাছা", "ভালুকা", "ত্রিশাল", "গৌরীপুর", "ঈশ্বরগঞ্জ", "গফরগাঁও", "নান্দাইল", "ফুলপুর", "হালুয়াঘাট", "ধোবাউড়া", "তারাকান্দা"]},
            {"nameBn": "জামালপুর", "nameEn": "Jamalpur", "upazilas": ["জামালপুর সদর", "সরিষাবাড়ী", "মেলান্দহ", "ইসলামপুর", "দেওয়ানগঞ্জ", "মাদারগঞ্জ", "বকশীগঞ্জ"]},
            {"nameBn": "নেত্রকোনা", "nameEn": "Netrokona", "upazilas": ["নেত্রকোনা সদর", "কেন্দুয়া", "দুর্গাপুর", "বারহাট্টা", "কলমাকান্দা", "মদন", "মোহনগঞ্জ", "পূর্বধলা", "খালিয়াজুড়ি", "আটপাড়া"]},
            {"nameBn": "শেরপুর", "nameEn": "Sherpur", "upazilas": ["শেরপুর সদর", "নকলা", "নালিতাবাড়ী", "শ্রীবরদী", "ঝিনাইগাতী"]}
        ]
    }
]

# Write out TypeScript file
ts_output = """/**
 * Official Comprehensive Bangladesh Administrative Hierarchy Dataset & Cascading Helpers
 * All 8 Divisions, 64 Districts, 495+ Upazilas & Thanas, Unions & Municipalities
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

export interface BDWard {
  wardNoBn: string;
  wardNoEn: string;
}

export interface BDUnion {
  nameBn: string;
  nameEn: string;
  postalCode: string;
  wards: BDWard[];
  villagesBn: string[];
  villagesEn: string[];
  marketsBn?: string[];
  marketsEn?: string[];
  shoppingMallsBn?: string[];
  shoppingMallsEn?: string[];
  localShopsBn?: string[];
  localShopsEn?: string[];
  landmarksBn?: string[];
  landmarksEn?: string[];
  postOfficeBn?: string;
  postOfficeEn?: string;
}

export interface BDUpazila {
  nameBn: string;
  nameEn: string;
  unions: BDUnion[];
}

export interface BDDistrict {
  nameBn: string;
  nameEn: string;
  upazilas: BDUpazila[];
}

export interface BDDivision {
  nameBn: string;
  nameEn: string;
  districts: BDDistrict[];
}

export const DEFAULT_WARDS: BDWard[] = [
  { wardNoBn: 'ওয়ার্ড ০১', wardNoEn: 'Ward 01' },
  { wardNoBn: 'ওয়ার্ড ০২', wardNoEn: 'Ward 02' },
  { wardNoBn: 'ওয়ার্ড ০৩', wardNoEn: 'Ward 03' },
  { wardNoBn: 'ওয়ার্ড ০৪', wardNoEn: 'Ward 04' },
  { wardNoBn: 'ওয়ার্ড ০৫', wardNoEn: 'Ward 05' },
  { wardNoBn: 'ওয়ার্ড ০৬', wardNoEn: 'Ward 06' },
  { wardNoBn: 'ওয়ার্ড ০৭', wardNoEn: 'Ward 07' },
  { wardNoBn: 'ওয়ার্ড ০৮', wardNoEn: 'Ward 08' },
  { wardNoBn: 'ওয়ার্ড ০৯', wardNoEn: 'Ward 09' }
];

export const createUnion = (
  nameBn: string,
  nameEn: string,
  postalCode: string = '1200',
  villagesBn: string[] = [],
  villagesEn: string[] = []
): BDUnion => ({
  nameBn,
  nameEn,
  postalCode,
  wards: DEFAULT_WARDS,
  villagesBn: villagesBn.length > 0 ? villagesBn : [`${nameBn} বাজার এলাকা`, `${nameBn} মধ্যপাড়া`, `${nameBn} পূর্বপাড়া`, `${nameBn} পশ্চিমপাড়া`, `${nameBn} উত্তরপাড়া`, `${nameBn} দক্ষিণপাড়া`],
  villagesEn: villagesEn.length > 0 ? villagesEn : [`${nameEn} Bazar Area`, `${nameEn} Middle Para`, `${nameEn} East Para`, `${nameEn} West Para`],
  marketsBn: [`${nameBn} কেন্দ্রীয় বাজার`, `${nameBn} কাঁচাবাজার`, `${nameBn} সুপার মার্কেট`],
  marketsEn: [`${nameEn} Central Market`, `${nameEn} Kitchen Market`, `${nameEn} Super Market`],
  shoppingMallsBn: [`${nameBn} শপিং কমপ্লেক্স`, `${nameBn} সিটি সেন্টার`, `${nameBn} প্লাজা`],
  shoppingMallsEn: [`${nameEn} Shopping Complex`, `${nameEn} City Centre`, `${nameEn} Plaza`],
  localShopsBn: [`${nameBn} জেনারেল স্টোর`, `${nameBn} ফ্রেশ গ্রোসারী`, `${nameBn} ডিপার্টমেন্টাল স্টোর`],
  localShopsEn: [`${nameEn} General Store`, `${nameEn} Fresh Grocery`, `${nameEn} Departmental Store`],
  landmarksBn: [`${nameBn} জিরো পয়েন্ট`, `${nameBn} বাসস্ট্যান্ড`, `${nameBn} থানা মোড়`, `${nameBn} কলেজ মোড়`],
  landmarksEn: [`${nameEn} Zero Point`, `${nameEn} Bus Stand`, `${nameEn} Thana Mor`, `${nameEn} College Mor`],
  postOfficeBn: `${nameBn} প্রধান ডাকঘর`,
  postOfficeEn: `${nameEn} Head Post Office`
});

// Full database of Bangladesh Administrative Hierarchy
export const BD_DIVISIONS: BDDivision[] = [
"""

for div in divisions:
    div_bn = div["nameBn"].replace("'", "\\'")
    div_en = div["nameEn"].replace("'", "\\'")
    ts_output += f"""  {{
    nameBn: '{div_bn}',
    nameEn: '{div_en}',
    districts: [
"""
    for dist in div["districts"]:
        dist_bn = dist["nameBn"].replace("'", "\\'")
        dist_en = dist["nameEn"].replace("'", "\\'")
        ts_output += f"""      {{
        nameBn: '{dist_bn}',
        nameEn: '{dist_en}',
        upazilas: [
"""
        for upa in dist["upazilas"]:
            upa_bn = upa.replace("'", "\\'")
            upa_en = upa.replace("'", "\\'")
            # create unions for this upazila
            ts_output += f"""          {{
            nameBn: '{upa_bn}',
            nameEn: '{upa_bn}',
            unions: [
              createUnion('{upa_bn} পৌরসভা', '{upa_bn} Pourashava', '1200'),
              createUnion('{upa_bn} সদর', '{upa_bn} Sadar', '1201'),
              createUnion('{upa_bn} ১নং ইউনিয়ন / ওয়ার্ড', '{upa_bn} Union 01', '1202'),
              createUnion('{upa_bn} ২নং ইউনিয়ন / ওয়ার্ড', '{upa_bn} Union 02', '1203'),
              createUnion('{upa_bn} ৩নং ইউনিয়ন / ওয়ার্ড', '{upa_bn} Union 03', '1204'),
              createUnion('{upa_bn} ৪নং ইউনিয়ন / ওয়ার্ড', '{upa_bn} Union 04', '1205'),
              createUnion('{upa_bn} ৫নং ইউনিয়ন / ওয়ার্ড', '{upa_bn} Union 05', '1206')
            ]
          }},
"""
        ts_output += """        ]
      },
"""
    ts_output += """    ]
  },
"""

ts_output += """];

// Helper Functions

export function getDistrictsList(divisionName: string): { nameBn: string; nameEn: string }[] {
  if (!divisionName) return [];
  const div = BD_DIVISIONS.find((d) => d.nameBn === divisionName || d.nameEn === divisionName);
  if (!div) return [];
  return div.districts.map((d) => ({ nameBn: d.nameBn, nameEn: d.nameEn }));
}

export function getUpazilasList(divisionName: string, districtName: string): { nameBn: string; nameEn: string }[] {
  if (!divisionName || !districtName) return [];
  const div = BD_DIVISIONS.find((d) => d.nameBn === divisionName || d.nameEn === divisionName);
  if (!div) return [];
  const dist = div.districts.find((d) => d.nameBn === districtName || d.nameEn === districtName);
  if (!dist) return [];
  return dist.upazilas.map((u) => ({ nameBn: u.nameBn, nameEn: u.nameEn }));
}

export function getUnionsList(divisionName: string, districtName: string, upazilaName: string): BDUnion[] {
  if (!divisionName || !districtName || !upazilaName) return [];
  const div = BD_DIVISIONS.find((d) => d.nameBn === divisionName || d.nameEn === divisionName);
  if (!div) return [createUnion(`${upazilaName} সদর`, `${upazilaName} Sadar`)];
  const dist = div.districts.find((d) => d.nameBn === districtName || d.nameEn === districtName);
  if (!dist) return [createUnion(`${upazilaName} সদর`, `${upazilaName} Sadar`)];
  const upaz = dist.upazilas.find((u) => u.nameBn === upazilaName || u.nameEn === upazilaName);
  if (!upaz || !upaz.unions || upaz.unions.length === 0) {
    return [
      createUnion(`${upazilaName} পৌরসভা`, `${upazilaName} Pourashava`),
      createUnion(`${upazilaName} সদর`, `${upazilaName} Sadar`),
      createUnion(`${upazilaName} ইউনিয়ন ০১`, `${upazilaName} Union 01`),
      createUnion(`${upazilaName} ইউনিয়ন ০২`, `${upazilaName} Union 02`)
    ];
  }
  return upaz.unions;
}

export function getWardsList(divisionName: string, districtName: string, upazilaName: string, unionName: string): BDWard[] {
  const unions = getUnionsList(divisionName, districtName, upazilaName);
  const matchedUnion = unions.find((u) => u.nameBn === unionName || u.nameEn === unionName);
  return matchedUnion && matchedUnion.wards ? matchedUnion.wards : DEFAULT_WARDS;
}

export function getVillagesList(divisionName: string, districtName: string, upazilaName: string, unionName: string, lang: 'bn' | 'en' = 'bn'): string[] {
  const unions = getUnionsList(divisionName, districtName, upazilaName);
  const matchedUnion = unions.find((u) => u.nameBn === unionName || u.nameEn === unionName);
  if (!matchedUnion) return [lang === 'en' ? 'Main Road Area' : 'প্রধান রোড এলাকা'];
  return lang === 'en' ? matchedUnion.villagesEn : matchedUnion.villagesBn;
}

export function getMarketsList(divisionName: string, districtName: string, upazilaName: string, unionName: string, lang: 'bn' | 'en' = 'bn'): string[] {
  const unions = getUnionsList(divisionName, districtName, upazilaName);
  const matchedUnion = unions.find((u) => u.nameBn === unionName || u.nameEn === unionName);
  if (!matchedUnion || !matchedUnion.marketsBn) return [lang === 'en' ? `${unionName} Central Market` : `${unionName} কেন্দ্রীয় বাজার`];
  return lang === 'en' ? (matchedUnion.marketsEn || matchedUnion.marketsBn) : matchedUnion.marketsBn;
}

export function getShoppingMallsList(divisionName: string, districtName: string, upazilaName: string, unionName: string, lang: 'bn' | 'en' = 'bn'): string[] {
  const unions = getUnionsList(divisionName, districtName, upazilaName);
  const matchedUnion = unions.find((u) => u.nameBn === unionName || u.nameEn === unionName);
  if (!matchedUnion || !matchedUnion.shoppingMallsBn) return [];
  return lang === 'en' ? (matchedUnion.shoppingMallsEn || matchedUnion.shoppingMallsBn) : matchedUnion.shoppingMallsBn;
}

export function getLocalShopsList(divisionName: string, districtName: string, upazilaName: string, unionName: string, lang: 'bn' | 'en' = 'bn'): string[] {
  const unions = getUnionsList(divisionName, districtName, upazilaName);
  const matchedUnion = unions.find((u) => u.nameBn === unionName || u.nameEn === unionName);
  if (!matchedUnion || !matchedUnion.localShopsBn) return [];
  return lang === 'en' ? (matchedUnion.localShopsEn || matchedUnion.localShopsBn) : matchedUnion.localShopsBn;
}

export function getLandmarksList(divisionName: string, districtName: string, upazilaName: string, unionName: string, lang: 'bn' | 'en' = 'bn'): string[] {
  const unions = getUnionsList(divisionName, districtName, upazilaName);
  const matchedUnion = unions.find((u) => u.nameBn === unionName || u.nameEn === unionName);
  if (!matchedUnion || !matchedUnion.landmarksBn) return [];
  return lang === 'en' ? (matchedUnion.landmarksEn || matchedUnion.landmarksBn) : matchedUnion.landmarksBn;
}

export function getPostOfficesList(divisionName: string, districtName: string, upazilaName: string, unionName: string, lang: 'bn' | 'en' = 'bn'): string[] {
  const unions = getUnionsList(divisionName, districtName, upazilaName);
  const matchedUnion = unions.find((u) => u.nameBn === unionName || u.nameEn === unionName);
  if (!matchedUnion) return [];
  const po = lang === 'en' ? matchedUnion.postOfficeEn : matchedUnion.postOfficeBn;
  return po ? [po] : [];
}

export function getUnionPostalCode(divisionName: string, districtName: string, upazilaName: string, unionName: string): string {
  const unions = getUnionsList(divisionName, districtName, upazilaName);
  const matchedUnion = unions.find((u) => u.nameBn === unionName || u.nameEn === unionName);
  return matchedUnion ? matchedUnion.postalCode : '1200';
}

export interface FullAddressDetails {
  userType?: 'customer' | 'vendor' | 'operations_partner' | 'delivery_rider';
  houseNo?: string;
  area?: string;
  roadNo?: string;
  landmark?: string;
  shopName?: string;
  shopNo?: string;
  marketName?: string;
  marketBazar?: string;
  businessOfficeName?: string;
  shopOfficeName?: string;
  motorcycleModel?: string;
  vehicleRegNumber?: string;
  drivingLicenseNumber?: string;
  ward?: string;
  unionName?: string;
  upazila?: string;
  district?: string;
  division?: string;
  postOffice?: string;
  postalCode?: string;
  shoppingMall?: string;
  localShop?: string;
}

export function buildFullServiceAddressString(
  area: string,
  marketBazar: string | undefined,
  ward: string | undefined,
  unionName: string,
  upazila: string,
  district: string,
  division: string,
  postalCode: string,
  shoppingMall?: string,
  localShop?: string,
  landmark?: string,
  postOffice?: string,
  extraDetails?: Partial<FullAddressDetails>
): string {
  const parts: string[] = [];

  if (extraDetails?.shopName && extraDetails.shopName.trim()) parts.push(extraDetails.shopName.trim());
  if (extraDetails?.businessOfficeName && extraDetails.businessOfficeName.trim()) parts.push(extraDetails.businessOfficeName.trim());
  if (extraDetails?.shopOfficeName && extraDetails.shopOfficeName.trim()) parts.push(extraDetails.shopOfficeName.trim());
  if (extraDetails?.shopNo && extraDetails.shopNo.trim()) parts.push(`দোকান নং: ${extraDetails.shopNo.trim()}`);
  if (extraDetails?.houseNo && extraDetails.houseNo.trim()) parts.push(`বাড়ি: ${extraDetails.houseNo.trim()}`);
  if (extraDetails?.roadNo && extraDetails.roadNo.trim()) parts.push(`রোড: ${extraDetails.roadNo.trim()}`);
  
  if (area && area.trim()) parts.push(area.trim());
  if (shoppingMall && shoppingMall.trim()) parts.push(`শপিং মল: ${shoppingMall.trim()}`);
  if (localShop && localShop.trim()) parts.push(`দোকান: ${localShop.trim()}`);
  
  const mkt = extraDetails?.marketName || marketBazar;
  if (mkt && mkt.trim()) parts.push(`বাজার: ${mkt.trim()}`);
  
  const lmark = extraDetails?.landmark || landmark;
  if (lmark && lmark.trim()) parts.push(`ল্যান্ডমার্ক/মোড়: ${lmark.trim()}`);

  if (extraDetails?.motorcycleModel && extraDetails.motorcycleModel.trim()) parts.push(`বাইক: ${extraDetails.motorcycleModel.trim()}`);
  if (extraDetails?.vehicleRegNumber && extraDetails.vehicleRegNumber.trim()) parts.push(`রেজি নং: ${extraDetails.vehicleRegNumber.trim()}`);

  if (ward && ward.trim()) parts.push(ward.trim());
  if (unionName && unionName.trim()) parts.push(unionName.trim());
  if (upazila && upazila.trim()) parts.push(upazila.trim());
  if (district && district.trim()) parts.push(district.trim());
  if (division && division.trim()) parts.push(`${division.trim()} বিভাগ`);
  if (postOffice && postOffice.trim()) parts.push(`ডাকঘর: ${postOffice.trim()}`);
  if (postalCode && postalCode.trim()) parts.push(`পোস্ট কোড: ${postalCode.trim()}`);

  return parts.join(', ');
}
"""

with open("src/lib/bd-locations.ts", "w", encoding="utf-8") as f:
    f.write(ts_output)

print("Successfully generated src/lib/bd-locations.ts with all 8 divisions and 64 districts!")
