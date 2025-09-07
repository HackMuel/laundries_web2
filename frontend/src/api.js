import axios from 'axios';

// 1. Ambil URL dari environment variable yang sudah kita atur
const apiUrl = process.env.REACT_APP_API_URL;

// 2. Buat sebuah instance (salinan) axios dengan konfigurasi default
//    baseURL akan otomatis ditambahkan di depan setiap panggilan API
const apiClient = axios.create({
    baseURL: apiUrl,
});

// 3. Ekspor instance tersebut agar bisa dipakai di file lain
export default apiClient;