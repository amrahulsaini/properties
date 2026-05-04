import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  ApiClient({required SharedPreferences preferences})
      : _preferences = preferences,
        tokenNotifier = ValueNotifier<String?>(preferences.getString(_tokenKey));

  static const _tokenKey = 'api_token';
  final SharedPreferences _preferences;
  final ValueNotifier<String?> tokenNotifier;

  String get baseUrl {
    const configured = String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'http://10.0.2.2:3000',
    );
    return configured;
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/v1/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    final payload = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 400) {
      throw Exception(payload['error'] ?? 'Login failed');
    }

    final token = payload['token'] as String?;
    if (token == null || token.isEmpty) {
      throw Exception('Token was not returned by the API.');
    }

    await _preferences.setString(_tokenKey, token);
    tokenNotifier.value = token;
  }

  Future<void> logout() async {
    await _preferences.remove(_tokenKey);
    tokenNotifier.value = null;
  }

  Future<Map<String, dynamic>> getJson(String path) async {
    final response = await http.get(
      Uri.parse('$baseUrl$path'),
      headers: _headers,
    );

    final payload = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode >= 400) {
      throw Exception(payload['error'] ?? 'Request failed');
    }

    return payload;
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (tokenNotifier.value != null) 'Authorization': 'Bearer ${tokenNotifier.value}',
      };
}
