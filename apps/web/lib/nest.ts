import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule, loadAppConfig } from "@newt-app-ssl-auth-example/api";
import type { INestApplicationContext, Type, Abstract } from "@nestjs/common";

let context: Promise<INestApplicationContext> | null = null;

export function getContext(): Promise<INestApplicationContext> {
  context ??= NestFactory.createApplicationContext(AppModule.register(loadAppConfig(process.env)), {
    logger: false,
  });
  return context;
}

export async function inject<T>(token: Type<T> | Abstract<T> | string | symbol): Promise<T> {
  const ctx = await getContext();
  return ctx.get<T>(token);
}
