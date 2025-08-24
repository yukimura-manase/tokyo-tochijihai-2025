import { SERVER_URL } from "@/constants/env";

export class UserApi {
  private constructor() {}

  /**
   * Google認証情報を検証する
   * @param email メールアドレス
   * @returns ユーザーが存在するかどうか
   */
  static async verifyGoogleAuth(email: string) {
    const response = await fetch(`${SERVER_URL}/api/users/verify-google-auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error("Failed to verify Google auth");
    }

    return response.json();
  }

  /**
   * ユーザーを新規登録する
   * @param userData ユーザー情報
   * @returns 登録されたユーザー情報
   */
  static async registerUser(userData: {
    email: string;
    name: string;
    googleId: string;
  }) {
    const response = await fetch(`${SERVER_URL}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error("Failed to register user");
    }

    return response.json();
  }

  /**
   * ユーザー情報を取得する
   * @param userId ユーザーID
   * @returns ユーザー情報
   */
  static async getUser(userId: string) {
    const response = await fetch(`${SERVER_URL}/api/users/${userId}`);

    if (!response.ok) {
      throw new Error("Failed to get user");
    }

    return response.json();
  }
}
