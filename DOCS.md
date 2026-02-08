# IMAI API

### Complete API Reference Documentation

### Base URL: https://imai.co/api

### Protocol: HTTPS

#### IMAI API provides access to audience demographic and psychographic attributes of Instagram, YouTube, TikTok,

#### and Douyin users based on their active audience and social media presence. Supports user lookups by user ID or

#### username.

#### Authentication: Send your API key in the authkey header with every request.

#### Rate Limiting: Max 10 requests/second per user. YouTube and TikTok Raw API: 100 req/sec. Instagram Raw API

#### has endpoint-specific limits.


## Table of Contents

#### 1. Pricing Table

#### 2. Error Codes

#### 3. Dictionaries

#### 3.1 Get Brand Logo

#### 3.2 List Interests and Brands

#### 3.3 List Languages

#### 3.4 Get Relevant Topic Tags

#### 3.5 List Topic Tags

#### 3.6 List Topic Tags (CSV)

#### 3.7 List Users (Autocomplete)

#### 3.8 Get Users Info by IDs

#### 3.9 List Geolocations

#### 4. Audience Data

#### 4.1 New Report

#### 4.2 Audience Overlap

#### 4.3 Fetch Report File

#### 5. Search

#### 5.1 Search for Influencers

#### 5.2 Unlock Influencers

#### 6. Sponsored Posts

#### 6.1 Search Posts

#### 6.2 Top Brands / Hashtags / Mentions / Sponsors

#### 7. Raw API - Instagram

#### 7.1 User Info / Feed / Reels / Stories / Highlights / IGTV

#### 7.2 Media Info / Comments / Replies

#### 7.3 Hashtag Feed & Info / Audio Feed / Search

#### 8. Raw API - TikTok

#### 8.1 User Info / Feed / Media / Video

#### 8.2 Challenge Info & Feed / Music Info & Feed

#### 8.3 Comments / Replies / Search / Short Link

#### 9. Raw API - YouTube

#### 9.1 Channel Info / Videos / Uploaded Videos

#### 9.2 Playlist / Video Info / Comments / Replies

#### 10. Raw API - Douyin

#### 10.1 User Info / Feed / Media Info / Comments / Replies

#### 11. Raw Export API

#### 11.1 Get Contact Details

#### 11.2 Export Notable Followers

#### 11.3 Match Emails

#### 12. Finance

#### 12.1 Account Info


## 1. Pricing Table

```
Category Endpoint Cost
Audience Data /reports/new/ 1 token (free if dry_run=true)
Audience Data /reports/overlap/ 1 token per report returned
Search /search/newv1/ Tokens for unindexed results
Sponsored Posts /market_scan/posts/search/ 0.02 tokens
Raw API (IG) /raw/ig/* endpoints 0.02 tokens, max 1 req/sec
Raw API (TT) /raw/tt/* endpoints 0.02 tokens
Raw API (YT) /raw/yt/* endpoints 0.02 tokens
Raw API (DY) /raw/dy/* endpoints 0.02 tokens
Export /exports/contacts/ 0.04 tokens
Export /exports/notable_users/ 0.04-0.06 tokens per user
Export /match_emails/ 0.04 tokens per matched email
```

## 2. Error Codes

#### Error responses follow this format:

```
{ "success": false, "error": "Code", "error_message": "Message" }
HTTP Code Description
400 bad_request Bad request
400 account_not_found Account does not exist on social media
400 account_data_removed Info removed at account holder's request
400 account_removed Account removed from social media
400 account_is_private User made account private
400 empty_audience No specific audience for this account
400 empty_audience_data No audience data at all
400 retry_later Audience updating, retry in 5-10 min
400 bad_filter Bad filter value
400 entity_not_found Entity does not exist
400 entity_is_hidden Access restricted (geo/age)
400 no_tokens_remaining Not enough tokens
400 no_quota_remaining Not enough quota
400 daily_tokens_limit_exceeded Daily spending limit exceeded (UTC)
401 not_authenticated No API Key provided
403 invalid_api_key Invalid API Key
403 permission_denied No permission for operation
403 token_is_disabled Token disabled
403 tokens_expired Subscription expired
403 subscription_expired Active subscription expired
403 subscription_required Subscription required
404 not_found URL does not exist
405 method_not_allowed Wrong HTTP method used
429 rate_limit_exceeded Rate limit exceeded
500 internal_server_error Internal error, retry later
```

## 3. Dictionaries

#### Helper dictionaries for objects like brands, countries, cities, and languages. Requests to dictionaries are free.

#### Recommended to cache as they update rarely.

### GET /dict/brand-logos/{brand_id} — Get Brand Logo

#### Returns the brand logo image file for a given brand ID.

```
Name Type In Description
brand_id * integer path Brand ID
```
### GET /dict/interests/ — List Interests and Brands

#### Lists all interests and brands usable as filters in Search or returned in Audience Data reports. Instagram only.

```
Name Type In Description
hide_deprecated boolean query Default: true
```
#### Response example:

```
{ "success": true, "data": { "interests": [{"id": 1, "name": "Television &amp; Film", "count":
13454, "deprecated": true}], "brands": [{"id": 46, "name": "Aeropostale", "count": 111,
"deprecated": false, "interest": [{"id": 7}]}] } }
```
### GET /dict/langs/ — List Languages

#### Lists all supported languages ordered by descending frequency.

```
Name Type In Description
platform string query instagram | tiktok | youtube. Default: instagram
```
#### Response example:

```
{ "success": true, "data": [ {"code": "en", "name": "English", "count": 20972231}, {"code": "es",
"name": "Spanish", "count": 14818868} ] }
```
### GET /dict/relevant-tags/ — Get Relevant Topic Tags

#### Returns relevant topic tags for a query. Use # for hashtags and @ for usernames (URL-encoded).

```
Name Type In Description
q * string query Search query. e.g. %23cats for #cats
limit integer query Max results. Default: 60
platform string query instagram | tiktok | youtube. Default: instagram
```
#### Response example:

```
{ "success": true, "data": [ {"tag": "#cats", "distance": 0, "freq": 13.707, "tag_cnt": 897207},
{"tag": "#catsofinstagram", "distance": 0.105, "freq": 13.801, "tag_cnt": 985930} ] }
```
### GET /dict/topic-tags/ — List Topic Tags

```
Name Type In Description
q * string query Search query for topic tags
```

```
limit integer query Max results. Default: 25
platform string query instagram | tiktok | youtube. Default: instagram
{"success": true, "data": [{"tag": "string", "value": "string"}]}
```
### GET /dict/topic-tags/csv/ — List Topic Tags (CSV)

#### Returns CSV with all tags available in relevance search filter. Full response ~14MB for Instagram.

```
Name Type In Description
skip integer query Default: 0
limit integer query Return all if not provided
platform string query instagram | tiktok | youtube. Default: instagram
```
### GET /dict/users/ — List Users (Autocomplete)

#### Autocomplete users available under audience lookalike, relevance filters, or social media accounts.

```
Name Type In Description
q string query Search query
limit integer query Max results. Default: 10
type * string query lookalike | topic-tags | search
platform string query instagram | tiktok | youtube. Default: instagram
```
#### Response example:

```
{ "success": true, "data": [ {"user_id": "184692323", "username": "ladygaga", "fullname": "Lady
Gaga", "followers": 36846974, "is_verified": true, "picture": "..."} ] }
```
### GET /dict/users/by_ids — Get Users Info by IDs

```
Name Type In Description
q * string query Comma-separated user IDs (max 20)
type * string query lookalike | topic-tags | search
platform string query instagram | tiktok | youtube. Default: instagram
```
### GET /geos/ — List Geolocations

#### List geo locations. Set limit=50000 for the full list (~32k locations).

```
Name Type In Description
q string query Search query
limit integer query Limit results. Default: 10
country_code string query Limit to specific country
types string query Comma-separated: city, subdivision, country
```
#### Response example:

```
[ {"id": 51800, "type": ["city"], "name": "London", "title": "London, United Kingdom", "country":
{"id": 62149}} ]
```

## 4. Audience Data

### POST /reports/new/ — New Report

$ 1 token per report (free if dry_run=true)

#### Creates a new audience data report. Also accepts GET for testing. Use user_id over username where possible.

#### Reports stored for 60 days.

```
Name Type In Description
data * object body Filter object with geo, language, gender, age_group, following_group, brand,
interest, is_fake
url string query Instagram username, userId or profile link
ignore_removed boolean query Get old data for removed accounts. Default: false
ignore_outdated boolean query Get report despite retry_later. Default: false
ignore_empty_aud
ience
```
```
boolean query Ignore empty audience. Default: false
```
```
dry_run boolean query Check if report can be built without charging. Default: false
platform string query instagram | tiktok | youtube | douyin. Default: instagram
```
#### Request body example:

```
{ "filter": { "geo": [0], "language": ["string"], "gender": "MALE", "age_group": ["13-17"],
"following_group": "-500", "brand": [0], "interest": [0], "is_fake": true } }
```
#### Response includes: report_info (report_id, created, profile_updated), user_profile (full profile data with stats, posts,

#### reels, contacts, geo, similar users, brand affinity, top hashtags/mentions), audience_likers, audience_followers,

#### audience_commenters (each with demographics, geo, languages, interests, brands, credibility, notable users,

#### lookalikes), and extra histograms.

#### Key response fields in user_profile: type, user_id, username, fullname, followers, posts_count, engagements,

#### engagement_rate, avg_likes, avg_comments, avg_views, avg_reels_plays, stat_history, geo, contacts, top_hashtags,

#### top_mentions, brand_affinity, interests, similar_users, top_posts, commercial_posts, recent_posts, top_reels,

#### recent_reels.

#### Key audience data fields: audience_credibility, credibility_class, audience_types, audience_genders,

#### audience_ages, audience_genders_per_age, audience_ethnicities, audience_languages, audience_brand_affinity,

#### audience_interests, audience_geo (countries/states/cities), audience_lookalikes, notable_users,

#### audience_reachability.

#### Response header X-Tokens-Cost contains the number of spent tokens.

### POST /reports/overlap/ — Audience Overlap

$ 1 token per report returned

#### Check audience (followers) overlap for several users. Instagram and YouTube only. No limit on total accounts, but

#### processing is limited to 1 minute. Works well on ~100 random bloggers. On timeout, retry in 10-15 minutes.

```
Name Type In Description
platform string query instagram | youtube. Default: instagram
urls string query Comma-separated usernames or user IDs
fmt string query csv | json. Default: json
```
#### Response example:


```
{ "status": true, "report_info": {"total_followers": 69043993, "total_unique_followers": 40570297},
"data": [ {"user_id": "25749975", "username": "mercedesbenz", "followers": 26447483,
"unique_percentage": 0.342912, "overlapping_percentage": 0.657088} ], "cost": 1 }
```
### GET /reports/{report_id}/ — Fetch Report File

#### Fetch a previously generated report in JSON or PDF format. Reports kept for 30 days.

```
Name Type In Description
report_id * string path Report ID from new report response
fmt * string query pdf | json
```
#### Response is the same full report structure as the new report endpoint.


## 5. Search

### POST /search/newv1/ — Search for Influencers

$ Tokens charged for unindexed results

#### Search for influencers matching filters. Tip: inspect search requests in IMAI web interface browser dev tools - same

#### format. Video guide: loom.com/share/a3c2f2b7257b4e999d1762391fbb93f

```
Name Type In Description
data * object body Search filter, sort, paging, audience_source
platform string query instagram | tiktok | youtube. Default: instagram
```
#### Available search filters: audience_age, audience_age_range, audience_brand, audience_brand_category,

#### audience_gender, audience_geo, audience_lang, audience_race, audience_relevance, brand, brand_category,

#### engagements, views, posts_count, reels_plays, shares, saves, followers, gender, age, geo, lang, followers_growth,

#### total_views_growth, total_likes_growth, relevance, text, text_advanced, keywords, text_tags, engagement_rate,

#### is_hidden, is_verified, account_type, has_ads, ads_brands, with_contact, audience_credibility,

#### audience_credibility_class, filter_ids, last_posted, has_audience_data, username, actions, post_type, semantic.

#### Sort: field (e.g. engagements), direction (asc/desc), id.

#### Paging: limit (max 100), skip.

#### audience_source: any.

#### Request example:

```
{ "filter": { "followers": {"left_number": 10000, "right_number": 100000}, "audience_gender":
{"code": "FEMALE", "weight": 0.5}, "audience_geo": [{"id": 51800, "weight": 0.05}],
"engagement_rate": {"value": 2, "operator": "gte"} }, "sort": {"field": "engagements", "direction":
"desc"}, "paging": {"limit": 100, "skip": 0}, "audience_source": "any" }
```
#### Response: accounts array (each with account info + match data including audience demographics), total count,

#### shown_accounts, cost.

### POST /search/unhide/ — Unlock Influencers

#### Show information for influencers hidden in search results.

```
Name Type In Description
data * object body {"search_result_ids": ["string"]}
platform string query instagram | tiktok | youtube. Default: instagram
```
#### Response includes full account and audience match data, plus cost and tokens used.


## 6. Sponsored Posts

#### Scanning social media for sponsored posts detected via commercial hashtags or official paid partnership tags.

### POST /market_scan/posts/search/ — Search Posts

$ 0.02 tokens per succeeded request

#### Search sponsored posts with filters for date range, followers range, likes range, and more.

### POST /market_scan/posts/top_brands/ — Top Brands

#### Get top brands from sponsored posts.

### POST /market_scan/posts/top_hashtags/ — Top Hashtags

#### Get top hashtags from sponsored posts.

### POST /market_scan/posts/top_mentions/ — Top Mentions

#### Get top mentions from sponsored posts.

### POST /market_scan/posts/top_sponsors/ — Top Sponsors

#### Get top sponsors from sponsored posts.


## 7. Raw API - Instagram

$ 0.02 tokens per request. Max 1 req/sec for most endpoints.

### GET /raw/ig/user/info/ — User Info

#### Returns user info by ID or username.

```
Name Type In Description
url * string query Username, userId, or profile link
{ "status": "ok", "user": { "pk": 0, "username": "string", "full_name": "string", "is_business":
true, "is_private": true, "is_verified": true, "media_count": 0, "follower_count": 0,
"following_count": 0, "biography": "string", "external_url": "string", "category": "string",
"has_clips": "string" } }
```
### GET /raw/ig/user/feed/ — User Feed

#### Returns user feed posts.

```
Name Type In Description
url * string query Username, userId, or profile link
after string query end_cursor from last response for pagination
```
### GET /raw/ig/user/feed_more/ — User Feed More Data

#### Additional feed data.

```
Name Type In Description
url * string query Username, userId, or profile link
after string query end_cursor for pagination
```
### GET /raw/ig/user/reels/ — User Reels

#### Returns user reels (up to 21/page). Paginate with end_cursor.

```
Name Type In Description
url * string query Username, userId, or profile link
after string query end_cursor for pagination
{ "items": [{"media": {"pk": 0, "code": "string", "comment_count": 0, "like_count": 0,
"play_count": 0, "video_duration": 0, "caption": {"text": "string"}}}], "more_available": "string",
"end_cursor": "string", "status": "ok" }
```
### GET /raw/ig/user/reels_more/ — User Reels More Data

#### Additional reels data (reshare_count, repost_count). Up to 12/page.

```
Name Type In Description
url * string query Username, userId, or profile link
after string query end_cursor for pagination
```

### GET /raw/ig/user/stories/ — User Stories

#### Returns user stories.

```
Name Type In Description
url * string query Username, userId, or profile link
```
### GET /raw/ig/user/highlights/ — User Highlights

#### Returns user highlights.

```
Name Type In Description
url * string query Username, userId, or profile link
```
### GET /raw/ig/user/igtv/ — User IGTV

#### Returns user IGTV videos.

```
Name Type In Description
url * string query Username, userId, or profile link
```
### GET /raw/ig/user/reposted_feed/ — Reposts Feed

#### Returns user's reposted content.

```
Name Type In Description
url * string query Username, userId, or profile link
```
### GET /raw/ig/media/info/ — Media Info

#### Returns media/post information.

```
Name Type In Description
url * string query Media URL or ID
```
### GET /raw/ig/media/info_more/ — Media Info More Data

#### Additional media data.

```
Name Type In Description
url * string query Media URL or ID
```
### GET /raw/ig/media/comments/ — Media Comments

#### Returns comments on a post.

```
Name Type In Description
url * string query Media URL or ID
after string query Cursor for pagination
```

### GET /raw/ig/media/comments/replies/ — Comment Replies

#### Returns replies to a comment.

```
Name Type In Description
url * string query Media URL or ID
after string query Cursor for pagination
```
### GET /raw/ig/hashtag/feed/ — Hashtag Feed

#### Returns posts for a hashtag.

```
Name Type In Description
url * string query Hashtag
after string query Cursor for pagination
```
### GET /raw/ig/hashtag/info/ — Hashtag Info

#### Returns hashtag information.

```
Name Type In Description
url * string query Hashtag
```
### GET /raw/ig/audio/feed/ — Audio Feed

#### Returns posts using an audio clip.

```
Name Type In Description
url * string query Audio ID or URL
```
### GET /raw/ig/highlight/info/ — Highlight Info

#### Returns highlight reel information.

```
Name Type In Description
url * string query Highlight ID
```
### GET /raw/ig/search/users/ — Search Users

#### Search Instagram users.

```
Name Type In Description
url * string query Search query
```
### GET /raw/ig/search/reels/ — Search Reels

#### Search Instagram reels.

```
Name Type In Description
url * string query Search query
```

### GET /raw/ig/usertags/feed/ — User Tags Feed

#### Returns posts the user is tagged in.

```
Name Type In Description
url * string query Username, userId, or profile link
```

## 8. Raw API - TikTok

$ 0.02 tokens per request. 100 req/sec limit.

### GET /raw/tt/user/info/ — User Info

#### Returns TikTok user info.

```
Name Type In Description
url * string query Username or user ID
```
### GET /raw/tt/user/feed/ — User Feed

#### Returns user's feed videos.

```
Name Type In Description
url * string query Username or user ID
after string query Cursor for pagination
```
### GET /raw/tt/user/media/ — Media Info

#### Returns media information.

```
Name Type In Description
url * string query Media URL or ID
```
### GET /raw/tt/user/media/video/ — Media Video Content

#### Returns video content/download URL.

```
Name Type In Description
url * string query Media URL or ID
```
### GET /raw/tt/challenge/info/ — Challenge Info

#### Returns challenge/hashtag info.

```
Name Type In Description
url * string query Challenge name or ID
```
### GET /raw/tt/challenge/feed/ — Challenge Feed

#### Returns videos in a challenge.

```
Name Type In Description
url * string query Challenge name or ID
after string query Cursor
```
### GET /raw/tt/music/info/ — Music Info


#### Returns music/sound info.

```
Name Type In Description
url * string query Music ID
```
### GET /raw/tt/music/feed/ — Music Feed

#### Returns videos using a sound.

```
Name Type In Description
url * string query Music ID
after string query Cursor
```
### GET /raw/tt/comments/ — Comments

#### Returns comments on a video.

```
Name Type In Description
url * string query Video URL or ID
after string query Cursor
```
### GET /raw/tt/reply/comments/ — Comment Replies

#### Returns replies to a comment.

```
Name Type In Description
url * string query Video URL or ID
after string query Cursor
```
### GET /raw/tt/search/users/ — Search Users

#### Search TikTok users.

```
Name Type In Description
url * string query Search query
```
### GET /raw/tt/resolve_short_link/ — Resolve Short Link

#### Resolves a TikTok short link to full URL.

```
Name Type In Description
url * string query Short link URL
```

## 9. Raw API - YouTube

$ 0.02 tokens per request. 100 req/sec limit.

### GET /raw/yt/channel/info/ — Channel Info

#### Returns YouTube channel information.

```
Name Type In Description
url * string query Channel URL or ID
```
### GET /raw/yt/channel/videos/ — Channel Videos Preview

#### Returns preview of channel videos.

```
Name Type In Description
url * string query Channel URL or ID
```
### GET /raw/yt/channel/videos/uploaded/ — Uploaded Videos

#### Returns uploaded videos list.

```
Name Type In Description
url * string query Channel URL or ID
```
### GET /raw/yt/playlist/ — Playlist Videos

#### Returns up to 100 videos from a playlist.

```
Name Type In Description
url * string query YouTube playlistId
{ "success": true, "videos_list": { "total": 0, "videos": [ {"video_id": "string", "thumbnail":
"string", "title": "string", "time": "string"} ] } }
```
### GET /raw/yt/video/ — Video Info

#### Returns video information.

```
Name Type In Description
url * string query YouTube video page URL
{ "success": true, "video_info": { "video_id": "string", "channel_id": "string", "title": "string",
"views": 0, "likes": 0, "comments": 0, "duration": "string", "description": "string", "keywords":
["string"], "subtitles": [{"language_code": "string", "name": "string"}], "comments_tabs":
[{"type": "top", "cursor": "string"}] } }
```
### GET /raw/yt/video/comments/ — Video Comments

#### Returns video comments with pagination. Use cursor from video info for first page.

```
Name Type In Description
url * string query YouTube video page URL
```

```
after * string query cursor from last response
{ "success": true, "comments_list": { "comments": [ {"comment_id": "string", "author_name":
"string", "likes": 0, "text": "string", "reply_count": 0, "replies_cursor": "string"} ], "cursor":
"string" } }
```
### GET /raw/yt/video/comments/replies/ — Comment Replies

#### Returns replies to a specific comment. Use replies_cursor from comments.

```
Name Type In Description
url * string query YouTube video page URL
after * string query cursor from last response
```

## 10. Raw API - Douyin

$ 0.02 tokens per request.

### GET /raw/dy/user/info/ — User Info

#### Returns Douyin user information.

```
Name Type In Description
url * string query User/media identifier
```
### GET /raw/dy/user/feed/ — User Feed

#### Returns Douyin user feed.

```
Name Type In Description
url * string query User/media identifier
```
### GET /raw/dy/media/info/ — Media Info

#### Returns Douyin media information.

```
Name Type In Description
url * string query User/media identifier
```
### GET /raw/dy/comments/ — Comments

#### Returns comments on Douyin content.

```
Name Type In Description
url * string query User/media identifier
```
### GET /raw/dy/reply/comments/ — Comment Replies

#### Returns replies to Douyin comments.

```
Name Type In Description
url * string query User/media identifier
```

## 11. Raw Export API

### GET /exports/contacts/ — Get Contact Details

$ 0.04 tokens per success response

```
Name Type In Description
url * string query Username, userId, or profile link
platform string query instagram | tiktok | youtube. Default: instagram
```
#### Response example:

```
{ "success": true, "user_profile": { "user_id": "10529896", "username": "niomismart", "fullname":
"Niomi Smart", "contacts": [ {"type": "email", "value": "niomi.smart@gleamfutures.com"}, {"type":
"youtube", "value": "niomismart"} ] } }
```
#### Error no_contacts returned if no contacts found.

### GET /exports/notable_users/ — Export Notable Followers

$ 0.04 tokens/user (min_followers=1000) or 0.06 tokens/user (min_followers=5000)

#### Export notable followers of an influencer. Free with dry_run=true or only_exported_short=true.

```
Name Type In Description
url * string query Username, userId, or profile link
platform string query instagram | tiktok | youtube. Default: instagram
fmt string query json (JSONPerLine) | csv
dry_run * boolean query Estimate cost without exporting. Default: false
has_email boolean query Calculate users with email (dry_run only). Default: false
audience string query all | followers | likers | commenters. Default: all
min_followers integer query Min followers threshold. Default: 1000
exclude_exported boolean query Exclude previously exported. Default: true
save_to_exported boolean query Save to exported list. Default: true
only_exported_sh
ort
```
```
boolean query Get only previously exported who follow. Default: false
```
#### Dry run response:

```
{"count": 0, "has_email": 0, "cost": 0}
```
### POST /match_emails/ — Match Emails

$ 0.04 tokens per matched email

#### Find social media accounts (Instagram, YouTube, TikTok) matching provided emails.

```
Name Type In Description
data * object body {"emails": ["string"]}
```
#### Response example:

```
{ "success": true, "matched_count": 0, "matched_emails": [ {"email": "string", "users": [ {"type":
"instagram", "user_id": "string", "username": "string", "followers": 0} ]} ], "not_matched_emails":
```

["string"] }


## 12. Finance

### GET /account/info/ — Account Info

#### Get information about your remaining tokens and quota. Free request.

```
Name Type In Description
```
#### Response:

```
{"success": true, "credits": 0}
```
### End of IMAI API Documentation


