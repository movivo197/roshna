import { createHash } from 'crypto';

export type TelegramPost = {
  id: string;
  channel: string;
  channelTitle: string;
  channelAvatar?: string;
  text: string;
  url: string;
  photo?: string;
  date: string;
};

export type TelegramChannelFeed = {
  channel: string;
  channelTitle: string;
  channelAvatar?: string;
  description?: string;
  subscribers?: string;
  posts: TelegramPost[];
  fetchedAt: string;
};

const cache = new Map<string, { data: TelegramChannelFeed; expires: number }>();

function cleanText(html: string): string {
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export async function fetchTelegramChannel(channelName: string): Promise<TelegramChannelFeed> {
  const cleanHandle = channelName.trim().replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '').replace(/\/$/, '').toLowerCase();
  
  if (!cleanHandle || !/^[a-zA-Z0-9_]{3,40}$/.test(cleanHandle)) {
    throw new Error('نام کاربری کانال تلگرام نامعتبر است.');
  }

  const cached = cache.get(cleanHandle);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const url = `https://t.me/s/${cleanHandle}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'fa,en-US,en;q=0.9',
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`کانال تلگرام «@${cleanHandle}» پیدا نشد یا عمومی (Public) نیست.`);
    }
    throw new Error(`خطا در ارتباط با سرورهای تلگرام (${response.status})`);
  }

  const html = await response.text();

  // Extract Channel Title
  const titleMatch = /<div class="tgme_channel_info_header_title"[^>]*><span[^>]*>(.*?)<\/span>/i.exec(html) ||
                     /<div class="tgme_channel_info_header_title"[^>]*>(.*?)<\/div>/i.exec(html);
  const channelTitle = titleMatch ? cleanText(titleMatch[1]) : cleanHandle;

  // Extract Channel Avatar
  const avatarMatch = /<img class="tgme_page_photo_image" src="([^"]+)"/i.exec(html);
  const channelAvatar = avatarMatch ? avatarMatch[1] : undefined;

  // Extract Channel Description
  const descMatch = /<div class="tgme_channel_info_description[^"]*"[^>]*>(.*?)<\/div>/i.exec(html);
  const description = descMatch ? cleanText(descMatch[1]) : undefined;

  // Extract Subscribers Count
  const counterMatch = /<div class="tgme_channel_info_counter"><span class="counter_value">([^<]+)<\/span><span class="counter_type">([^<]+)<\/span>/i.exec(html);
  const subscribers = counterMatch ? `${counterMatch[1]} ${counterMatch[2]}` : undefined;

  // Extract Posts
  const posts: TelegramPost[] = [];
  const messageRegex = /<div class="tgme_widget_message_wrap[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi;
  const messageBlocks = html.split('<div class="tgme_widget_message_wrap');

  for (let i = 1; i < messageBlocks.length; i++) {
    const block = messageBlocks[i];

    // Extract Post URL
    const urlMatch = /<a class="tgme_widget_message_date" href="([^"]+)"/i.exec(block);
    const postUrl = urlMatch ? urlMatch[1] : `https://t.me/${cleanHandle}`;

    // Extract Date
    const timeMatch = /<time datetime="([^"]+)"/i.exec(block);
    const date = timeMatch ? timeMatch[1] : new Date().toISOString();

    // Extract Text
    const textMatch = /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(block);
    const text = textMatch ? cleanText(textMatch[1]) : '';

    // Extract Photo
    let photo: string | undefined;
    const photoWrapMatch = /background-image:url\('([^']+)'\)/i.exec(block);
    if (photoWrapMatch) {
      photo = photoWrapMatch[1];
    } else {
      const imgMatch = /<img class="tgme_widget_message_photo[^"]*" src="([^"]+)"/i.exec(block);
      if (imgMatch) photo = imgMatch[1];
    }

    if (text || photo) {
      const id = createHash('sha256').update(postUrl).digest('hex').slice(0, 16);
      posts.push({
        id,
        channel: cleanHandle,
        channelTitle,
        channelAvatar,
        text: text.slice(0, 2000),
        url: postUrl,
        photo,
        date,
      });
    }
  }

  // Telegram displays newest posts at the bottom, so reverse to show newest first
  posts.reverse();

  const result: TelegramChannelFeed = {
    channel: cleanHandle,
    channelTitle,
    channelAvatar,
    description,
    subscribers,
    posts: posts.slice(0, 30),
    fetchedAt: new Date().toISOString(),
  };

  cache.set(cleanHandle, { data: result, expires: Date.now() + 90_000 }); // Cache for 90s
  return result;
}
