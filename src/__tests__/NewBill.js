/**
 * @jest-environment jsdom
 */

import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {screen, fireEvent, waitFor} from "@testing-library/dom";

import { ROUTES, ROUTES_PATH } from "../constants/routes.js";

import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

jest.mock("../app/store", () => mockStore);
afterEach(() => {
  jest.resetAllMocks();
  document.body.innerHTML = "";
});

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then ...",  () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      //to-do write assertion
    })
    test("Then handleChangeFile and handleSubmit should be called on submission of a file and the form", async () => {
      jest.spyOn(mockStore, "bills");

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      Object.defineProperty(window, "location", {
        value: { hash: ROUTES_PATH["NewBill"] },
      });
      window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
      );

      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBillInit = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const file = new File(["image"], "image.png", { type: "image/png" });
      const handleChangeFile = jest.fn((e)=>newBillInit.handleChangeFile(e));
      const formNewBill = screen.getByTestId("form-new-bill");
      const billFile = screen.getByTestId("file");

      billFile.addEventListener("change", (e)=> handleChangeFile(e));
      userEvent.upload(billFile, file);
      await waitFor(async ()=>{
        await expect(newBillInit.billId).toBeDefined();
        await expect(newBillInit.billId).toBe('1234');
        await expect(newBillInit.fileUrl).toBeDefined();
        await expect(newBillInit.fileUrl).toBe('https://localhost:3456/images/test.jpg');
        await expect(newBillInit.fileName).toBeDefined();
        await expect(newBillInit.fileName).toBe('image.png');
      },1000)

      expect(billFile.files[0].name).toBeDefined();
      expect(handleChangeFile).toBeCalled();

      const handleSubmit = jest.spyOn( newBillInit,'handleSubmit');
      formNewBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(formNewBill);
      expect(handleSubmit).toHaveBeenCalled();
    });
  })
})
