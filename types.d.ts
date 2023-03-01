import type { TerraformConstructor } from 'cdktf/lib/testing/matchers';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toHaveResource(resourceConstructor: TerraformConstructor): R;
      toHaveResourceWithProperties(
        resourceConstructor: TerraformConstructor,
        properties: Record<string, any>
      ): R;

      toHaveDataSource(dataSourceConstructor: TerraformConstructor): R;
      toHaveDataSourceWithProperties(
        dataSourceConstructor: TerraformConstructor,
        properties: Record<string, any>
      ): R;

      toHaveProvider(providerConstructor: TerraformConstructor): R;
      toHaveProviderWithProperties(
        providerConstructor: TerraformConstructor,
        properties: Record<string, any>
      ): R;

      toBeValidTerraform(): R;
      toPlanSuccessfully(): R;
    }
  }
}
