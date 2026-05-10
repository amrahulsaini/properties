import 'dart:convert';
import 'dart:io';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

const _baseUrl = 'https://samarthrealty.properties';
const _tokenKey = 'ps_auth_token';
const _storage = FlutterSecureStorage();

Future<String?> getToken() => _storage.read(key: _tokenKey);
Future<void> setToken(String t) => _storage.write(key: _tokenKey, value: t);
Future<void> clearToken() => _storage.delete(key: _tokenKey);

Future<Map<String, String>> _authHeaders() async {
  final token = await getToken();
  return {
    'Content-Type': 'application/json',
    if (token != null) 'Authorization': 'Bearer $token',
  };
}

Future<dynamic> apiGet(String path) async {
  final res = await http.get(
    Uri.parse('$_baseUrl$path'),
    headers: await _authHeaders(),
  );
  final body = jsonDecode(res.body);
  if (res.statusCode >= 400) throw Exception(body['error'] ?? 'HTTP ${res.statusCode}');
  return body;
}

Future<dynamic> apiPost(String path, Map<String, dynamic> data) async {
  final res = await http.post(
    Uri.parse('$_baseUrl$path'),
    headers: await _authHeaders(),
    body: jsonEncode(data),
  );
  final body = jsonDecode(res.body);
  if (res.statusCode >= 400) throw Exception(body['error'] ?? 'HTTP ${res.statusCode}');
  return body;
}

Future<dynamic> apiPut(String path, Map<String, dynamic> data) async {
  final res = await http.put(
    Uri.parse('$_baseUrl$path'),
    headers: await _authHeaders(),
    body: jsonEncode(data),
  );
  final body = jsonDecode(res.body);
  if (res.statusCode >= 400) throw Exception(body['error'] ?? 'HTTP ${res.statusCode}');
  return body;
}

Future<void> apiDelete(String path) async {
  final res = await http.delete(
    Uri.parse('$_baseUrl$path'),
    headers: await _authHeaders(),
  );
  if (res.statusCode >= 400) {
    final body = jsonDecode(res.body);
    throw Exception(body['error'] ?? 'HTTP ${res.statusCode}');
  }
}

Future<Map<String, dynamic>> login(String email, String password) async {
  final res = await http.post(
    Uri.parse('$_baseUrl/api/v1/auth/login'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'email': email, 'password': password}),
  );
  final body = jsonDecode(res.body) as Map<String, dynamic>;
  if (res.statusCode >= 400) throw Exception(body['error'] ?? 'Login failed');
  if (body['token'] != null) await setToken(body['token'] as String);
  return body;
}

Future<void> logout() async {
  try {
    await apiPost('/api/v1/auth/logout', {});
  } catch (_) {}
  await clearToken();
}

Future<String> downloadPdf(String path, {Map<String, String>? params}) async {
  final token = await getToken();
  var uri = Uri.parse('$_baseUrl$path');
  if (params != null && params.isNotEmpty) uri = uri.replace(queryParameters: params);
  final res = await http.get(uri, headers: {
    if (token != null) 'Authorization': 'Bearer $token',
  });
  if (res.statusCode >= 400) throw Exception('PDF generation failed (${res.statusCode})');
  final dir = await getTemporaryDirectory();
  final file = File('${dir.path}/samarth_${DateTime.now().millisecondsSinceEpoch}.pdf');
  await file.writeAsBytes(res.bodyBytes);
  return file.path;
}

Future<String> uploadFile(String filePath, String mimeType, String filename) async {
  final token = await getToken();
  final req = http.MultipartRequest('POST', Uri.parse('$_baseUrl/api/v1/upload'));
  if (token != null) req.headers['Authorization'] = 'Bearer $token';
  req.files.add(await http.MultipartFile.fromPath('file', filePath, filename: filename));
  final streamed = await req.send();
  final body = jsonDecode(await streamed.stream.bytesToString()) as Map<String, dynamic>;
  if (streamed.statusCode >= 400) throw Exception(body['error'] ?? 'Upload failed');
  return '$_baseUrl${body['url']}';
}
