
const fetch = require('node-fetch');

const BASE_URL = 'https://dramabos.asia/api/dramabox/api';

async function testApi() {
    try {
        console.log('Fetching drama list...');
        const forYouResponse = await fetch(`${BASE_URL}/foryou/1`);
        const forYouData = await forYouResponse.json();

        if (!forYouData.success || !forYouData.data || forYouData.data.length === 0) {
            console.error('Failed to fetch drama list or list is empty.');
            return;
        }

        const firstDrama = forYouData.data[0];
        const bookId = firstDrama.bookId;
        console.log(`Found drama: ${firstDrama.bookName} (ID: ${bookId})`);

        console.log(`Fetching video URL for bookId: ${bookId}, index: 1...`);
        const videoResponse = await fetch(`${BASE_URL}/watch/player?bookId=${bookId}&index=1&lang=th`);

        console.log('Video API Response Status:', videoResponse.status);
        const videoText = await videoResponse.text();
        console.log('Video API Response Body:', videoText);

        try {
            const videoJson = JSON.parse(videoText);
            if (videoJson.success) {
                console.log('Video URL:', videoJson.data);
            } else {
                console.error('Video API returned error:', videoJson.message);
            }
        } catch (e) {
            console.error('Failed to parse video response as JSON');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testApi();
